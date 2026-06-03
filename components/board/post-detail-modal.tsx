'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Flag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useComments } from '@/lib/hooks/use-comments';
import { useReactions } from '@/lib/hooks/use-reactions';
import type { Comment, EmojiType, Post } from '@/lib/types';
import { linkify } from '@/lib/utils/linkify';

const EMOJIS: { type: EmojiType; label: string }[] = [
  { type: 'thumbsup', label: '👍' },
  { type: 'heart', label: '❤️' },
  { type: 'party', label: '🎉' },
  { type: 'bulb', label: '💡' },
  { type: 'thinking', label: '🤔' },
];

const COLOR_MAP: Record<string, string> = {
  yellow: 'bg-yellow-100',
  blue: 'bg-indigo-100',
  pink: 'bg-pink-100',
  green: 'bg-green-100',
  purple: 'bg-purple-100',
  gray: 'bg-gray-100',
};

interface PostDetailModalProps {
  post: Post;
  boardId: string;
  currentUid: string;
  currentNickname: string;
  isHost: boolean;
  /** 운영자가 토글하는 반응 수 노출 여부. 호스트에게는 항상 표시. */
  showReactionCounts: boolean;
  onClose: () => void;
  onDelete: (postId: string) => Promise<void>;
}

export function PostDetailModal({
  post,
  boardId,
  currentUid,
  currentNickname,
  isHost,
  showReactionCounts,
  onClose,
  onDelete,
}: PostDetailModalProps) {
  const { comments, addComment, deleteComment } = useComments(boardId, post.id);
  const { toggleReaction, getCount, myEmoji } = useReactions(boardId, post.id);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [reportComment, setReportComment] = useState<Comment | null>(null);
  const [reportingPost, setReportingPost] = useState(false);
  const canReportPost = post.authorId !== currentUid && !isHost;

  // Esc로 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await addComment({ authorId: currentUid, authorName: currentNickname, content: commentText.trim() });
      setCommentText('');
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: Post['createdAt']) {
    if (!ts?.toDate) return '';
    return formatDistanceToNow(ts.toDate(), { addSuffix: true, locale: ko });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="포스트 상세"
      >
        {/* 헤더 */}
        <div className={`rounded-t-2xl px-5 py-4 ${COLOR_MAP[post.color] ?? 'bg-gray-100'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">{linkify(post.content)}</p>
              {post.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt="포스트 이미지"
                    className="w-full object-cover max-h-60 rounded-lg"
                  />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 flex-shrink-0 focus-visible:outline focus-visible:outline-2 rounded"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 font-medium">{post.authorName} · {formatTime(post.createdAt)}</span>
            <div className="flex items-center gap-2">
              {canReportPost && (
                <button
                  onClick={() => setReportingPost(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 focus-visible:outline focus-visible:outline-2 rounded"
                  aria-label="포스트 신고"
                >
                  <Flag size={11} /> 신고
                </button>
              )}
              {(post.authorId === currentUid || isHost) && (
                <button
                  onClick={() => { onDelete(post.id); onClose(); }}
                  className="text-xs text-red-400 hover:text-red-600 focus-visible:outline focus-visible:outline-2 rounded"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 이모지 반응 */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          {EMOJIS.map(({ type, label }) => {
            const count = getCount(type);
            const isMyReaction = myEmoji(currentUid) === type;
            return (
              <button
                key={type}
                onClick={() => toggleReaction(currentUid, type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors focus-visible:outline focus-visible:outline-2 ${
                  isMyReaction
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {label}
                {count > 0 && (showReactionCounts || isHost) && (
                  <span className="text-xs font-semibold">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 댓글 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">아직 댓글이 없습니다.</p>
          )}
          {comments.map((c) => {
            const canReportComment = c.authorId !== currentUid && !isHost;
            return (
              <div key={c.id} className="flex gap-2 group">
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
                    <div className="flex items-center gap-1.5">
                      {canReportComment && (
                        <button
                          onClick={() => setReportComment(c)}
                          className="text-[10px] text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 rounded"
                          aria-label="댓글 신고"
                          title="신고"
                        >
                          <Flag size={10} />
                        </button>
                      )}
                      {(c.authorId === currentUid || isHost) && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-[10px] text-gray-400 hover:text-red-500 focus-visible:outline focus-visible:outline-2 rounded"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 break-words">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 댓글 입력 */}
        <form onSubmit={handleComment} className="px-5 pb-4 pt-2 border-t border-gray-100 flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글 달기..."
            maxLength={300}
            rows={1}
            className="resize-none text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e as unknown as React.FormEvent); }
            }}
          />
          <Button
            type="submit"
            disabled={sending || !commentText.trim()}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white self-end"
          >
            등록
          </Button>
        </form>
      </div>

      {reportingPost && (
        <ReportDialog
          open={reportingPost}
          onClose={() => setReportingPost(false)}
          boardId={boardId}
          targetType="post"
          targetId={post.id}
          targetSnapshot={post.content || ''}
          reporterId={currentUid}
          reporterName={currentNickname}
        />
      )}

      {reportComment && (
        <ReportDialog
          open={!!reportComment}
          onClose={() => setReportComment(null)}
          boardId={boardId}
          targetType="post"
          targetId={`${post.id}/comments/${reportComment.id}`}
          targetSnapshot={reportComment.content || ''}
          reporterId={currentUid}
          reporterName={currentNickname}
        />
      )}
    </div>
  );
}
