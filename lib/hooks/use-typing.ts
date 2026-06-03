'use client';

import { onValue, ref, remove, set } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { rtdb } from '@/lib/firebase/client';

const TYPING_TIMEOUT_MS = 3000;
const STALE_THRESHOLD_MS = 5000;

export interface TypingUser {
  uid: string;
  name: string;
}

export function useTyping(boardId: string, uid: string, name: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!boardId || !rtdb) return;

    const typingRef = ref(rtdb, `typing/${boardId}`);
    const unsub = onValue(typingRef, (snap) => {
      if (!snap.exists()) { setTypingUsers([]); return; }
      const now = Date.now();
      const users: TypingUser[] = [];
      snap.forEach((child) => {
        const val = child.val() as { name?: unknown; typingAt?: unknown } | null;
        if (!val || typeof val.typingAt !== 'number' || typeof val.name !== 'string') return;
        if (child.key !== uid && now - val.typingAt < STALE_THRESHOLD_MS) {
          users.push({ uid: child.key!, name: val.name });
        }
      });
      setTypingUsers(users);
    }, () => {});

    return () => {
      unsub();
      if (uid && rtdb) remove(ref(rtdb, `typing/${boardId}/${uid}`)).catch(() => {});
    };
  }, [boardId, uid]);

  const startTyping = useCallback(() => {
    if (!boardId || !uid || !name || !rtdb) return;

    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      set(ref(rtdb, `typing/${boardId}/${uid}`), { name, typingAt: Date.now() }).catch(() => {});
    }

    clearTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      remove(ref(rtdb, `typing/${boardId}/${uid}`)).catch(() => {});
    }, TYPING_TIMEOUT_MS);
  }, [boardId, uid, name]);

  const stopTyping = useCallback(() => {
    if (!boardId || !uid || !rtdb) return;
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    isTypingRef.current = false;
    remove(ref(rtdb, `typing/${boardId}/${uid}`)).catch(() => {});
  }, [boardId, uid]);

  return { typingUsers, startTyping, stopTyping };
}
