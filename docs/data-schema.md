# Data Schema

> Fadlet의 Firestore 데이터 구조와 보안 규칙. 데이터 모델 변경 시 이 문서와 `firestore.rules`를 함께 업데이트한다.

---

## 📂 컬렉션 계층

```
/workspaces/{wsId}                          (Phase 1: "default" 단일, Phase 3: 다중)
├─ /members/{userId}                        (Phase 3+)
├─ /usage-logs/{logId}                      (Phase 3+)
└─ /boards/{boardId}
   ├─ /posts/{postId}
   │  ├─ /comments/{commentId}              (Phase 2+)
   │  └─ /reactions/{reactionId}            (Phase 2+)
   ├─ /messages/{messageId}
   ├─ /participants/{userId}
   └─ /reports/{reportId}                   (Phase 3+)
```

---

## 🗂 컬렉션별 스키마

### `/workspaces/{wsId}`

| 필드 | 타입 | Phase | 설명 |
|---|---|---|---|
| `name` | string | 1 | 워크스페이스 이름 |
| `ownerId` | string | 1 | 소유자 UID |
| `plan` | string | 3 | `free`/`team`/`business`/`enterprise` |
| `billing` | object | 3 | 토스페이먼츠 결제 정보 |
| `businessInfo` | object | 3 | 사업자 정보 (세금계산서용) |
| `limits` | object | 3 | 플랜별 사용 한도 |
| `usage` | object | 3 | 현재 사용량 |
| `settings` | object | 3 | 브랜딩·SSO 등 설정 |
| `createdAt` | timestamp | 1 | 생성 시각 |
| `updatedAt` | timestamp | 1 | 수정 시각 |

**Phase 1**: `wsId = "default"` 단일 워크스페이스만 사용. Phase 3에서 다중 워크스페이스 도입.

---

### `/workspaces/{wsId}/boards/{boardId}`

| 필드 | 타입 | Phase | 설명 |
|---|---|---|---|
| `title` | string | 1 | 보드 제목 |
| `boardCode` | string | 1 | 6자리 영숫자 (대문자) |
| `template` | string | 1/2 | `free`(1) → +`brainstorming`/`kpt`/`4f`/`qna`/`nineWindow`(2) |
| `templateConfig` | object? | 2 | 템플릿별 설정 |
| `ownerId` | string | 1 | 보드 소유자 UID |
| `workspaceId` | string | 1 | 부모 워크스페이스 |
| `settings` | object | 1 | 보드 설정 (아래 참조) |
| `stages` | array | 3 | 단계별 진행 정보 |
| `createdAt` | timestamp | 1 | 생성 시각 |
| `updatedAt` | timestamp | 1 | 수정 시각 |

**`settings` 객체**:
```typescript
{
  allowComments: boolean,    // Phase 2+
  allowReactions: boolean,   // Phase 2+
  allowChat: boolean,        // Phase 1 (기본 true)
  retainChatLog: boolean,    // Phase 1 (기본 true)
  isAnonymous: boolean,      // Phase 2+
  lockedAt: timestamp|null,  // Phase 1
}
```

**보드 코드 규칙**:
- 6자리, 대문자 영문 + 숫자
- 사용 문자: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (혼동 글자 0/O/1/I/L 제외)
- 발급 시 중복 체크, 충돌 시 최대 5회 재생성

---

### `/workspaces/{wsId}/boards/{boardId}/posts/{postId}`

| 필드 | 타입 | Phase | 설명 |
|---|---|---|---|
| `authorId` | string | 1 | 작성자 UID |
| `authorName` | string | 1 | 닉네임 |
| `content` | string | 1 | 텍스트 본문 |
| `imageUrl` | string? | 2 | Firebase Storage URL |
| `color` | string | 1 | `yellow`/`blue`/`pink`/`green`/`purple`/`gray` |
| `position` | object? | 1 | `{ x: number, y: number }` (자유 보드) |
| `columnId` | string? | 2 | 컬럼 보드용 (KPT, 4F 등) |
| `createdAt` | timestamp | 1 | 작성 시각 |
| `updatedAt` | timestamp | 1 | 수정 시각 |

---

### `/posts/{postId}/comments/{commentId}` (Phase 2+)

| 필드 | 타입 | 설명 |
|---|---|---|
| `authorId` | string | 작성자 UID |
| `authorName` | string | 닉네임 |
| `content` | string | 댓글 내용 |
| `createdAt` | timestamp | 작성 시각 |

---

### `/posts/{postId}/reactions/{reactionId}` (Phase 2+)

| 필드 | 타입 | 설명 |
|---|---|---|
| `userId` | string | 사용자 UID |
| `emoji` | string | `thumbsup`/`heart`/`party`/`bulb`/`thinking` |
| `createdAt` | timestamp | 추가 시각 |

**제약**: 사용자 1명당 포스트별 1개 이모지. `reactionId = userId` 사용 권장.

---

### `/workspaces/{wsId}/boards/{boardId}/messages/{messageId}`

| 필드 | 타입 | Phase | 설명 |
|---|---|---|---|
| `authorId` | string | 1 | 작성자 UID |
| `authorName` | string | 1 | 닉네임 |
| `role` | string | 1 | `host`/`member` |
| `type` | string | 1/2 | `text`(1) → +`image`/`file`/`link`(2) |
| `content` | string | 1 | 텍스트 또는 URL |
| `fileUrl` | string? | 2 | Storage URL |
| `fileName` | string? | 2 | 원본 파일명 |
| `fileSize` | number? | 2 | 바이트 |
| `linkPreview` | object? | 2 | OG 메타데이터 |
| `isPinned` | boolean? | 3 | 운영자 공지 고정 |
| `createdAt` | timestamp | 1 | 전송 시각 |

**`linkPreview` 객체** (Phase 2+):
```typescript
{
  url: string,
  title: string,
  description: string,
  image: string,
  siteName: string,
}
```

---

### `/workspaces/{wsId}/boards/{boardId}/participants/{userId}`

| 필드 | 타입 | 설명 |
|---|---|---|
| `nickname` | string | 닉네임 |
| `role` | string | `host`/`member` |
| `joinedAt` | timestamp | 입장 시각 |
| `lastActiveAt` | timestamp | 마지막 활동 |
| `isOnline` | boolean | 현재 접속 중 |

**문서 ID = userId** 사용. 입장 시 본인 문서만 작성 가능.

---

## 🔒 Firestore Security Rules

### Phase 1 버전
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(wsId, boardId) {
      return get(/databases/$(database)/documents/workspaces/$(wsId)/boards/$(boardId)).data.ownerId == request.auth.uid;
    }

    match /workspaces/{wsId}/boards/{boardId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if isAuthenticated()
        && resource.data.ownerId == request.auth.uid;

      match /posts/{postId} {
        allow read: if true;
        allow create: if isAuthenticated()
          && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if isAuthenticated()
          && (resource.data.authorId == request.auth.uid || isOwner(wsId, boardId));
      }

      match /messages/{messageId} {
        allow read: if true;
        allow create: if isAuthenticated()
          && request.resource.data.authorId == request.auth.uid;
        allow update, delete: if isAuthenticated()
          && (resource.data.authorId == request.auth.uid || isOwner(wsId, boardId));
      }

      match /participants/{userId} {
        allow read: if true;
        allow write: if isAuthenticated()
          && request.auth.uid == userId;
      }
    }
  }
}
```

### Phase 2 추가 규칙
```javascript
match /workspaces/{wsId}/boards/{boardId}/posts/{postId} {
  match /comments/{commentId} {
    allow read: if true;
    allow create: if isAuthenticated()
      && request.resource.data.authorId == request.auth.uid;
    allow update, delete: if isAuthenticated()
      && (resource.data.authorId == request.auth.uid || isOwner(wsId, boardId));
  }

  match /reactions/{reactionId} {
    allow read: if true;
    // 사용자당 1개 → 본인 reactionId만 작성/삭제
    allow create, delete: if isAuthenticated()
      && reactionId == request.auth.uid;
  }
}
```

### Phase 3 추가 규칙
```javascript
match /workspaces/{wsId} {
  allow read: if isAuthenticated()
    && (resource.data.ownerId == request.auth.uid
        || exists(/databases/$(database)/documents/workspaces/$(wsId)/members/$(request.auth.uid)));

  allow update: if isAuthenticated()
    && resource.data.ownerId == request.auth.uid;

  match /members/{userId} {
    allow read: if isAuthenticated()
      && exists(/databases/$(database)/documents/workspaces/$(wsId)/members/$(request.auth.uid));
    // admin만 멤버 추가/삭제
    allow write: if isAuthenticated()
      && get(/databases/$(database)/documents/workspaces/$(wsId)/members/$(request.auth.uid)).data.role == "admin";
  }

  match /boards/{boardId}/reports/{reportId} {
    allow read: if isAuthenticated() && isOwner(wsId, boardId);
    allow create: if isAuthenticated();
    allow update: if isAuthenticated() && isOwner(wsId, boardId);
  }
}
```

---

## 🗃 Firebase Storage 보안 규칙

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // 보드별 이미지·파일
    match /workspaces/{wsId}/boards/{boardId}/{fileType}/{fileId} {
      allow read: if true;

      // 인증된 사용자, 10MB 이하
      allow create: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && (fileType == "images" || fileType == "files");

      // 본인 또는 보드 소유자만 삭제
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 📊 인덱스 요구사항

다음 복합 인덱스를 Firestore에 등록:

```yaml
- collectionGroup: posts
  queryScope: COLLECTION
  fields:
    - fieldPath: createdAt
      order: ASCENDING

- collectionGroup: messages
  queryScope: COLLECTION
  fields:
    - fieldPath: createdAt
      order: ASCENDING

- collectionGroup: boards
  queryScope: COLLECTION
  fields:
    - fieldPath: workspaceId
      order: ASCENDING
    - fieldPath: createdAt
      order: DESCENDING

# Phase 3+: 신고 조회용
- collectionGroup: reports
  queryScope: COLLECTION
  fields:
    - fieldPath: status
      order: ASCENDING
    - fieldPath: createdAt
      order: DESCENDING
```

`firestore.indexes.json` 파일로 관리:
```bash
firebase deploy --only firestore:indexes
```

---

## 🔄 마이그레이션 가이드

### Phase 1 → Phase 2
- 기존 보드의 `template` 필드 검증 (`"free"`이 아닌 값 처리)
- `posts.imageUrl`, `posts.columnId` 옵셔널 필드 추가
- `messages.type` 기본값 `"text"` 설정 보장

### Phase 2 → Phase 3
- 기존 `wsId = "default"` 워크스페이스의 `plan` 필드 추가 (`"free"`)
- 기존 운영자에게 워크스페이스 admin 권한 부여
- 결제 정보 빈 객체로 초기화

---

## 🧪 데이터 작업 예시

### 보드 생성
```typescript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { generateBoardCode } from '@/lib/utils/generate-board-code';

async function createBoard(title: string, ownerId: string) {
  const boardCode = await generateBoardCode();

  const docRef = await addDoc(
    collection(db, 'workspaces/default/boards'),
    {
      title,
      boardCode,
      template: 'free',
      ownerId,
      workspaceId: 'default',
      settings: {
        allowChat: true,
        retainChatLog: true,
        lockedAt: null,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return { id: docRef.id, boardCode };
}
```

### 실시간 포스트 구독
```typescript
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

function subscribePosts(boardId: string, callback: (posts: Post[]) => void) {
  const q = query(
    collection(db, `workspaces/default/boards/${boardId}/posts`),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Post));
    callback(posts);
  });
}
```

---

## ⚠️ 주의사항

1. **`onSnapshot` 메모리 누수 방지**: useEffect cleanup에서 반드시 unsubscribe
2. **대량 쓰기 시 batch 사용**: 10개 이상은 `writeBatch()`로 묶기
3. **읽기 비용 절감**: 필요한 필드만 가져오기 (`limit`, `where` 적극 활용)
4. **인덱스 누락 에러**: 콘솔 로그의 인덱스 생성 링크 클릭하여 즉시 등록
5. **타임스탬프**: 클라이언트 시간이 아닌 `serverTimestamp()` 사용
