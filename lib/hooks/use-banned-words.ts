'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

export function findBannedHit(text: string, words?: string[]): string | null {
  if (!text || !words || words.length === 0) return null;
  const lower = text.toLowerCase();
  for (const w of words) {
    const n = normalize(w);
    if (n && lower.includes(n)) return w;
  }
  return null;
}

export function useBannedWords(boardId: string, current: string[] | undefined) {
  async function setWords(words: string[]) {
    await updateDoc(doc(db, boardsPath(), boardId), {
      bannedWords: words,
      updatedAt: serverTimestamp(),
    });
  }

  async function addWord(word: string) {
    const n = normalize(word);
    if (!n) return;
    const list = [...(current ?? [])];
    if (list.map(normalize).includes(n)) return;
    list.push(n);
    await setWords(list);
  }

  async function removeWord(word: string) {
    const n = normalize(word);
    const list = (current ?? []).filter((w) => normalize(w) !== n);
    await setWords(list);
  }

  return { addWord, removeWord };
}
