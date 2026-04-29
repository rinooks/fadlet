import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { workspacesCollectionPath } from '@/lib/firebase/collections';

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export async function generateWorkspaceCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = randomCode();
    const q = query(collection(db, workspacesCollectionPath()), where('workspaceCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) return code;
  }
  throw new Error('워크스페이스 코드 생성에 실패했습니다.');
}
