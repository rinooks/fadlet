import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * Firestore 보안 규칙 테스트 (firestore.rules)
 *
 * 실행: Firestore 에뮬레이터가 필요하다.
 *   npm run test:rules   (firebase emulators:exec 가 에뮬레이터를 띄우고 vitest 실행)
 *
 * 핵심 목적: "슈퍼관리자 계정으로만 테스트해서 놓치던" 비-슈퍼 사용자 권한 케이스를 고정한다.
 * 특히 members collectionGroup 쿼리(워크스페이스 목록) 회귀를 막는다.
 */

const PROJECT_ID = 'fadlet-rules-test';
const SUPER_EMAIL = 'rinooks@gmail.com'; // firestore.rules 의 isSuperAdmin() 이메일과 일치해야 함

const USER_A = 'userA';
const USER_B = 'userB';
const USER_C = 'userC';
const WS_A = 'ws-a';
const WS_B = 'ws-b';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

/** 인증된 사용자 컨텍스트의 Firestore (rules-unit-testing ↔ firebase/firestore 타입 정렬) */
function asUser(uid: string, email?: string): Firestore {
  return testEnv.authenticatedContext(uid, email ? { email } : undefined).firestore() as unknown as Firestore;
}
/** 미인증 컨텍스트의 Firestore */
function asGuest(): Firestore {
  return testEnv.unauthenticatedContext().firestore() as unknown as Firestore;
}
/** 규칙 우회 시드 */
async function seed(fn: (db: Firestore) => Promise<void>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore() as unknown as Firestore);
  });
}

describe('members collectionGroup — 워크스페이스 목록(회귀 방지)', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `workspaces/${WS_A}/members/${USER_A}`), { uid: USER_A, role: 'admin' });
      await setDoc(doc(db, `workspaces/${WS_B}/members/${USER_B}`), { uid: USER_B, role: 'member' });
    });
  });

  it('비-슈퍼 사용자가 본인 멤버십을 collectionGroup으로 조회할 수 있다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', USER_A))),
    );
  });

  it('타인 멤버십(uid 불일치) 조회는 거부된다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', USER_B))),
    );
  });

  it('미인증 사용자는 조회할 수 없다', async () => {
    const db = asGuest();
    await assertFails(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', USER_A))),
    );
  });

  it('슈퍼관리자는 본인 uid로 조회할 수 있다', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `workspaces/${WS_A}/members/superUid`), { uid: 'superUid', role: 'admin' });
    });
    const db = asUser('superUid', SUPER_EMAIL);
    await assertSucceeds(
      getDocs(query(collectionGroup(db, 'members'), where('uid', '==', 'superUid'))),
    );
  });
});

describe('워크스페이스 멤버 목록 (workspaces/{wsId}/members)', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `workspaces/${WS_A}/members/${USER_A}`), { uid: USER_A, role: 'admin' });
      await setDoc(doc(db, `workspaces/${WS_A}/members/${USER_B}`), { uid: USER_B, role: 'member' });
    });
  });

  it('같은 워크스페이스 멤버는 멤버 목록 전체를 조회할 수 있다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertSucceeds(getDocs(collection(db, `workspaces/${WS_A}/members`)));
  });

  it('비멤버는 멤버 목록을 조회할 수 없다', async () => {
    const db = asUser(USER_C, 'c@example.com');
    await assertFails(getDocs(collection(db, `workspaces/${WS_A}/members`)));
  });
});

describe('operators 생성 — 자동 승인 정책', () => {
  it('승인 설정이 없으면 allowed=true 로 본인 문서를 만들 수 있다(자동 승인 기본)', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertSucceeds(
      setDoc(doc(db, `operators/${USER_A}`), { uid: USER_A, allowed: true, isSuperAdmin: false }),
    );
  });

  it('승인 절차가 켜져 있으면 allowed=true 자체 생성이 거부된다', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'settings/global'), { requireOperatorApproval: true });
    });
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(
      setDoc(doc(db, `operators/${USER_A}`), { uid: USER_A, allowed: true, isSuperAdmin: false }),
    );
    // 대기 상태(false)로는 생성 가능
    await assertSucceeds(
      setDoc(doc(db, `operators/${USER_A}`), { uid: USER_A, allowed: false, isSuperAdmin: false }),
    );
  });

  it('비-슈퍼는 isSuperAdmin=true 로 자체 생성할 수 없다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(
      setDoc(doc(db, `operators/${USER_A}`), { uid: USER_A, allowed: false, isSuperAdmin: true }),
    );
  });

  it('남의 uid 로는 operator 문서를 만들 수 없다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(
      setDoc(doc(db, `operators/${USER_B}`), { uid: USER_B, allowed: true, isSuperAdmin: false }),
    );
  });
});

describe('operators 읽기', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `operators/${USER_A}`), { uid: USER_A, allowed: true, isSuperAdmin: false });
      await setDoc(doc(db, `operators/${USER_B}`), { uid: USER_B, allowed: true, isSuperAdmin: false });
    });
  });

  it('본인 operator 문서는 읽을 수 있다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertSucceeds(getDoc(doc(db, `operators/${USER_A}`)));
  });

  it('비-슈퍼는 타인 operator 문서를 읽을 수 없다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(getDoc(doc(db, `operators/${USER_B}`)));
  });

  it('슈퍼관리자는 타인 operator 문서를 읽을 수 있다', async () => {
    const db = asUser('superUid', SUPER_EMAIL);
    await assertSucceeds(getDoc(doc(db, `operators/${USER_B}`)));
  });
});

describe('settings 읽기 (가입 자동승인 판단에 필요)', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'settings/global'), { requireOperatorApproval: false });
    });
  });

  it('인증된 사용자는 settings 를 읽을 수 있다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertSucceeds(getDoc(doc(db, 'settings/global')));
  });

  it('미인증 사용자는 settings 를 읽을 수 없다', async () => {
    const db = asGuest();
    await assertFails(getDoc(doc(db, 'settings/global')));
  });

  it('비-슈퍼는 settings 를 쓸 수 없다', async () => {
    const db = asUser(USER_A, 'a@example.com');
    await assertFails(setDoc(doc(db, 'settings/global'), { requireOperatorApproval: true }));
  });
});

describe('boards 공개 읽기', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'workspaces/default/boards/b1'), {
        title: '보드', boardCode: 'AB12', ownerId: USER_A, workspaceId: WS_A,
      });
    });
  });

  it('미인증 사용자도 보드를 읽을 수 있다(참여자 입장)', async () => {
    const db = asGuest();
    await assertSucceeds(getDoc(doc(db, 'workspaces/default/boards/b1')));
  });
});
