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
    if (!boardId || !uid) return;
    if (!rtdb) {
      // databaseURL 환경변수 누락 시 rtdb가 null → 접속자 수가 0으로 고정된다.
      console.warn('[usePresence] Realtime Database가 초기화되지 않았습니다. NEXT_PUBLIC_FIREBASE_DATABASE_URL 환경변수를 확인하세요. (접속자 수가 0으로 표시됩니다)');
      return;
    }

    const sessionId = `${uid}_${Math.random().toString(36).slice(2, 9)}`;
    const sRef = ref(rtdb, `presence/${boardId}/${sessionId}`);
    sessionRef.current = sRef;

    set(sRef, { uid, connectedAt: Date.now() }).catch((err) => console.error('[usePresence] 세션 등록 실패', err));
    try { onDisconnect(sRef).remove(); } catch (err) { console.error('[usePresence] onDisconnect 설정 실패', err); }

    const boardPresenceRef = ref(rtdb, `presence/${boardId}`);
    let unsub: (() => void) | null = null;
    try {
      unsub = onValue(boardPresenceRef, (snap) => {
        setSessionCount(snap.exists() ? Object.keys(snap.val() as object).length : 0);
      }, (err) => { console.error('[usePresence] presence 구독 실패', err); });
    } catch (err) { console.error('[usePresence] presence 구독 등록 실패', err); }

    return () => {
      unsub?.();
      remove(sRef).catch(() => {});
    };
  }, [boardId, uid]);

  return { sessionCount };
}
