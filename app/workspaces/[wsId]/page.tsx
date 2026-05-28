'use client';

export const dynamic = 'force-dynamic';

import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Copy, Download, LogOut, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BoardDeleteDialog } from '@/components/board/board-delete-dialog';
import { BoardRenameDialog } from '@/components/board/board-rename-dialog';
import { db } from '@/lib/firebase/client';
import { boardsPath } from '@/lib/firebase/collections';
import { FREE_TIER_BOARDS_PER_WORKSPACE, showUpgradeMessage } from '@/lib/free-tier';
import { useOperatorAuth } from '@/lib/hooks/use-operator-auth';
import { leaveWorkspace, useWorkspace, useWorkspaceMembers } from '@/lib/hooks/use-workspaces';
import { getTemplate } from '@/lib/templates';
import type { Board } from '@/lib/types';
import { runFirestore } from '@/lib/utils/firestore-action';

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { wsId } = use(params);
  const router = useRouter();
  const { user, isOperator, isSuperAdmin, loading } = useOperatorAuth();
  const { workspace } = useWorkspace(wsId);
  const { members } = useWorkspaceMembers(wsId);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  const [renamingBoard, setRenamingBoard] = useState<Board | null>(null);

  const inviteUrl =
    workspace && typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard?join=${workspace.workspaceCode}`
      : '';

  const isOwner = !!user && !!workspace && workspace.ownerUid === user.uid;
  const isMember = !!user && members.some((m) => m.uid === user.uid);

  useEffect(() => {
    if (!loading && !isOperator) router.replace('/login');
  }, [isOperator, loading, router]);

  useEffect(() => {
    const q = query(
      collection(db, boardsPath()),
      where('workspaceId', '==', wsId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board);
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setBoards(list);
        setBoardsLoading(false);
      },
      (err) => {
        console.error('[workspace] boards snapshot error', err);
        setBoardsLoading(false);
      },
    );
    return unsub;
  }, [wsId]);

  function copyCode() {
    if (!workspace) return;
    navigator.clipboard.writeText(workspace.workspaceCode);
    toast.success('코드를 복사했습니다.');
  }

  function copyInviteLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('초대 링크를 복사했습니다.');
  }

  async function shareInvite() {
    if (!workspace || !inviteUrl) return;
    const shareData = {
      title: `${workspace.name} 워크스페이스 초대`,
      text: `${workspace.name} 워크스페이스에 초대합니다. 코드: ${workspace.workspaceCode}`,
      url: inviteUrl,
    };
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* 공유 취소 시 무시 */
      }
    }
    copyInviteLink();
  }

  async function handleLeave() {
    if (!user || isOwner) return;
    if (!confirm('정말 워크스페이스를 떠나시겠습니까?')) return;
    try {
      await leaveWorkspace(wsId, user.uid);
      toast.success('워크스페이스를 떠났습니다.');
      router.push('/dashboard');
    } catch {
      toast.error('탈퇴에 실패했습니다.');
    }
  }

  async function handleRemoveMember(memberUid: string) {
    if (!isOwner) return;
    if (!confirm('이 멤버를 워크스페이스에서 제외하시겠습니까?')) return;
    try {
      await leaveWorkspace(wsId, memberUid);
      toast.success('멤버를 제외했습니다.');
    } catch {
      toast.error('제외 실패');
    }
  }

  async function handleDeleteBoard(board: Board) {
    await runFirestore('보드를 삭제하지 못했습니다.', () =>
      deleteDoc(doc(db, boardsPath(), board.id)),
    );
    toast.success(`"${board.title}" 보드를 삭제했습니다.`);
  }

  async function handleRenameBoard(board: Board, nextTitle: string) {
    await runFirestore('보드 이름을 변경하지 못했습니다.', () =>
      updateDoc(doc(db, boardsPath(), board.id), {
        title: nextTitle,
        updatedAt: serverTimestamp(),
      }),
    );
    toast.success('보드 이름을 변경했습니다.');
  }

  if (loading || !isOperator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (workspace === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-3">워크스페이스를 찾을 수 없습니다.</p>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">내 워크스페이스로</Link>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-gray-700 font-semibold mb-1">{workspace.name}</p>
        <p className="text-sm text-gray-500 mb-4">멤버만 접근할 수 있습니다.</p>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">내 워크스페이스로</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <nav aria-label="현재 위치" className="flex items-center gap-2 min-w-0 flex-1 text-sm">
          <Link href="/" className="text-indigo-600 font-bold text-lg hover:text-indigo-700 transition-colors flex-shrink-0">
            Fadlet
          </Link>
          <span className="text-gray-300 flex-shrink-0" aria-hidden>›</span>
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-indigo-600 transition-colors flex-shrink-0 hidden sm:inline"
          >
            내 워크스페이스
          </Link>
          <span className="text-gray-300 flex-shrink-0 hidden sm:inline" aria-hidden>›</span>
          <h1 className="font-semibold text-gray-900 truncate" aria-current="page">
            {workspace.name}
          </h1>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 flex-shrink-0"
            aria-label="코드 복사"
          >
            {workspace.workspaceCode}
            <Copy size={10} />
          </button>
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/workspaces/${wsId}/export`, '_blank', 'noopener')}
            disabled={boards.length === 0}
            className="text-xs h-7"
            title={boards.length === 0 ? '보드가 없습니다' : '워크스페이스 전체를 PDF로 내보내기'}
          >
            <Download size={12} className="mr-1" /> 내보내기
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
          >
            <Share2 size={12} className="mr-1" /> 초대
          </Button>
          {!isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeave}
              className="text-xs h-7"
            >
              <LogOut size={12} className="mr-1" /> 떠나기
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 보드 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">📋 보드 ({boards.length})</h2>
            <Button
              size="sm"
              onClick={() => {
                if (!isSuperAdmin && boards.length >= FREE_TIER_BOARDS_PER_WORKSPACE) {
                  showUpgradeMessage('board');
                  return;
                }
                router.push(`/boards/new?workspaceId=${wsId}`);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-7 px-3"
            >
              + 새 보드
            </Button>
          </div>
          {boardsLoading ? (
            <p className="text-gray-400 text-sm text-center py-12">불러오는 중...</p>
          ) : boards.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-500">이 워크스페이스에 보드가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boards.map((board) => {
                const canManage = !!user && board.ownerId === user.uid;
                const template = getTemplate(board.template);
                const isWorkshop = board.mode === 'workshop';
                const isLocked = !!board.settings?.lockedAt;
                const stageCount = board.stages?.length ?? 0;
                return (
                  <div key={board.id} className="relative group">
                    <Link
                      href={`/boards/${board.id}`}
                      className="block bg-white rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                              isWorkshop
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                            aria-hidden
                          >
                            {template.emoji}
                          </div>
                          <div className="min-w-0 flex-1 pr-16">
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 leading-snug line-clamp-2 transition-colors">
                              {board.title}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              {template.label}
                              {isWorkshop && stageCount > 0 && ` · ${stageCount}단계`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {board.boardCode}
                          </span>
                          {isWorkshop && (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              🎬 워크숍
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              🔒 잠금
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                            {board.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                          </span>
                        </div>
                      </div>
                    </Link>
                    {canManage && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRenamingBoard(board);
                          }}
                          aria-label={`${board.title} 보드 이름 변경`}
                          title="이름 변경"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingBoard(board);
                          }}
                          aria-label={`${board.title} 보드 삭제`}
                          title="보드 삭제"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white text-gray-300 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 멤버 */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">👥 멤버 ({members.length})</h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.uid}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {m.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.displayName}</p>
                  {m.email && <p className="text-[11px] text-gray-500 truncate">{m.email}</p>}
                </div>
                {m.role === 'admin' && (
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">
                    관리자
                  </span>
                )}
                {isOwner && m.uid !== user?.uid && (
                  <button
                    onClick={() => handleRemoveMember(m.uid)}
                    className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0"
                    aria-label="멤버 제외"
                    title="멤버 제외"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{workspace.name}에 초대</DialogTitle>
            <DialogDescription>
              아래 링크나 코드를 공유하면 다른 사람이 이 워크스페이스에 가입할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">초대 링크</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 min-w-0 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-2 font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button size="sm" variant="outline" onClick={copyInviteLink} className="flex-shrink-0">
                  <Copy size={12} className="mr-1" /> 복사
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">가입 코드</label>
              <div className="flex gap-2">
                <div className="flex-1 font-mono text-base font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2 text-center tracking-widest">
                  {workspace.workspaceCode}
                </div>
                <Button size="sm" variant="outline" onClick={copyCode} className="flex-shrink-0">
                  <Copy size={12} className="mr-1" /> 복사
                </Button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                상대방이 대시보드에서 &lsquo;코드로 가입&rsquo;을 눌러 입력해도 됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>닫기</Button>
              <Button
                onClick={shareInvite}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                <Share2 size={14} className="mr-1" /> 공유
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BoardDeleteDialog
        open={!!deletingBoard}
        boardTitle={deletingBoard?.title ?? ''}
        onClose={() => setDeletingBoard(null)}
        onConfirm={async () => {
          if (deletingBoard) await handleDeleteBoard(deletingBoard);
        }}
      />

      <BoardRenameDialog
        open={!!renamingBoard}
        initialTitle={renamingBoard?.title ?? ''}
        onClose={() => setRenamingBoard(null)}
        onSubmit={async (nextTitle) => {
          if (renamingBoard) await handleRenameBoard(renamingBoard, nextTitle);
        }}
      />
    </div>
  );
}
