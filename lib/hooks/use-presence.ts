'use client';

import { onDisconnect, onValue, ref, remove, set } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { rtdb } from '@/lib/firebase/client';

/**
 * Firebase Realtime Database의 onDisconnect()를 이용한 presence 훅.
 * 브라우저 강제 종료·네트워크 단절 시에도 RTDB 서버가 자동으로 세션 항목을 제거한다.
 *
 * 각 탭마다 고유한 sessionId를 발급하므로 같은 UID가 여러 탭에서 열어도 정확히 카운팅된다.
 */
export function usePresence(boardId: string, uid: string | null) {
  const [sessionCount, setSessionCount] = useState(0);
  const sessionRef = useRef<ReturnType<typeof ref> | null>(null);

  useEffect(() => {
    if (!boardId || !uid || !rtdb) return;

    const sessionId = `${uid}_${Math.random().toString(36).slice(2, 9)}`;
    const sRef = ref(rtdb, `presence/${boardId}/${sessionId}`);
    sessionRef.current = sRef;

    set(sRef, { uid, connectedAt: Date.now() }).catch(() => {});
    try { onDisconnect(sRef).remove(); } catch { /* RTDB 미활성화 시 무시 */ }

    const boardPresenceRef = ref(rtdb, `presence/${boardId}`);
    let unsub: (() => void) | null = null;
    try {
      unsub = onValue(boardPresenceRef, (snap) => {
        setSessionCount(snap.exists() ? Object.keys(snap.val() as object).length : 0);
      }, () => { /* 연결 실패 시 조용히 처리 */ });
    } catch { /* RTDB 미활성화 시 무시 */ }

    return () => {
      unsub?.();
      remove(sRef).catch(() => {});
    };
  }, [boardId, uid]);

  return { sessionCount };
}
