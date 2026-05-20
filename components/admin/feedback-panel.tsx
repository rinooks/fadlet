'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, MessageSquare, RotateCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase/client';
import { feedbackPath } from '@/lib/firebase/collections';
import type { Feedback, FeedbackStatus } from '@/lib/types';

interface Props {
  uid: string;
}

type FilterTab = 'open' | 'resolved' | 'all';

export function FeedbackPanel({ uid }: Props) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('open');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, feedbackPath()), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback));
        setLoading(false);
      },
      (err) => {
        console.error('[feedback-panel] snapshot error', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const counts = useMemo(() => {
    let open = 0;
    let resolved = 0;
    for (const f of items) {
      if ((f.status ?? 'open') === 'resolved') resolved++;
      else open++;
    }
    return { open, resolved, all: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((f) => {
      const status = f.status ?? 'open';
      if (tab !== 'all' && status !== tab) return false;
      if (term) {
        const hay = `${f.message} ${f.email ?? ''} ${f.displayName ?? ''} ${f.url ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [items, tab, search]);

  async function handleToggleStatus(item: Feedback) {
    const next: FeedbackStatus = (item.status ?? 'open') === 'open' ? 'resolved' : 'open';
    try {
      await updateDoc(doc(db, `${feedbackPath()}/${item.id}`), {
        status: next,
        ...(next === 'resolved'
          ? { resolvedAt: serverTimestamp(), resolvedBy: uid }
          : { resolvedAt: null, resolvedBy: null }),
      });
      toast.success(next === 'resolved' ? '해결됨으로 표시했습니다.' : '다시 열었습니다.');
    } catch (err) {
      console.error('[feedback-panel] toggle status failed', err);
      toast.error('상태 변경에 실패했습니다.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, `${feedbackPath()}/${id}`));
      toast.success('피드백을 삭제했습니다.');
      setConfirmDelete(null);
    } catch (err) {
      console.error('[feedback-panel] delete failed', err);
      toast.error('삭제에 실패했습니다.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <TabButton active={tab === 'open'} onClick={() => setTab('open')}>
            미처리 <span className="ml-1 text-[10px] font-bold">{counts.open}</span>
          </TabButton>
          <TabButton active={tab === 'resolved'} onClick={() => setTab('resolved')}>
            해결됨 <span className="ml-1 text-[10px] font-bold">{counts.resolved}</span>
          </TabButton>
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            전체 <span className="ml-1 text-[10px] font-bold">{counts.all}</span>
          </TabButton>
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="내용·이메일·URL 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <MessageSquare size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {items.length === 0 ? '아직 도착한 피드백이 없습니다.' : '조건에 맞는 피드백이 없습니다.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((f) => {
            const status = f.status ?? 'open';
            const isOpen = status === 'open';
            const isConfirming = confirmDelete === f.id;
            return (
              <li
                key={f.id}
                className={`bg-white border rounded-xl p-4 ${
                  isOpen ? 'border-gray-200' : 'border-gray-100 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isOpen
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isOpen ? '미처리' : '해결됨'}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 truncate">
                        {f.displayName || f.email || '익명'}
                      </span>
                      {f.email && f.displayName && (
                        <span className="text-[11px] text-gray-400 truncate">{f.email}</span>
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto flex-shrink-0">
                        {f.createdAt?.toDate?.().toLocaleString('ko-KR') ?? ''}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed mb-2">
                  {f.message}
                </p>

                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline break-all"
                  >
                    <ExternalLink size={11} /> {f.url}
                  </a>
                )}

                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  {isConfirming ? (
                    <>
                      <span className="text-xs text-red-600 font-medium mr-auto">정말 삭제할까요?</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs h-8"
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(f.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs h-8"
                      >
                        삭제
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(f)}
                        className="text-xs h-8 flex items-center gap-1"
                      >
                        {isOpen ? (
                          <>
                            <Check size={12} /> 해결됨
                          </>
                        ) : (
                          <>
                            <RotateCcw size={12} /> 다시 열기
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDelete(f.id)}
                        className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> 삭제
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-7 rounded-md text-xs font-semibold transition-colors ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
