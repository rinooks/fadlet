'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerUpLeft, Paperclip, X, Images, Search, Pin, PinOff, Flag, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageAttachment } from './message-attachment';
import { MediaGallery } from './media-gallery';
import { truncateFileName } from '@/lib/utils/truncate-file-name';
import { ReportDialog } from '@/components/shared/report-dialog';
import { useAnnouncement } from '@/lib/hooks/use-announcement';
import { useTyping } from '@/lib/hooks/use-typing';
import { uploadChatFile } from '@/lib/utils/upload-file';
import { CHAT_MAX_LENGTH, type EmojiType, type Message, type MessageReplyTo, type PinnedAnnouncement, type UserRole } from '@/lib/types';

type Tab = 'chat' | 'media';

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'file';
}

const EMOJI_LIST: { key: EmojiType; emoji: string; label: string }[] = [
  { key: 'thumbsup', emoji: '👍', label: '좋아요' },
  { key: 'heart',    emoji: '❤️', label: '하트' },
  { key: 'party',    emoji: '🎉', label: '파티' },
  { key: 'bulb',     emoji: '💡', label: '아이디어' },
  { key: 'thinking', emoji: '🤔', label: '생각중' },
];

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  onlineCount: number;
  onSend: (content: string, fileAttachment?: FileAttachment, replyTo?: MessageReplyTo) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: EmojiType) => void;
  currentUid: string;
  currentName: string;
  currentRole: UserRole;
  boardId: string;
  pinnedAnnouncement?: PinnedAnnouncement | null;
  onClose?: () => void;
}

export function ChatPanel({ messages, loading, onlineCount, onSend, onToggleReaction, currentUid, currentName, currentRole, boardId, pinnedAnnouncement, onClose }: ChatPanelProps) {
  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { typingUsers, startTyping, stopTyping } = useTyping(boardId, currentUid, currentName);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const storageKey = `chat-last-read-${boardId}`;
  const viewerIsHost = currentRole === 'host';
  const { pinAnnouncement, unpinAnnouncement } = useAnnouncement(boardId);
  const [reportTarget, setReportTarget] = useState<Message | null>(null);

  async function handlePinMessage(msg: Message) {
    try {
      await pinAnnouncement(msg.content || msg.fileName || '(빈 메시지)', currentUid, currentName);
      toast.success('공지로 고정했습니다.');
    } catch {
      toast.error('공지 고정 실패');
    }
  }

  const [lastReadAt, setLastReadAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem(storageKey) ?? '0');
  });
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const initialScrollDone = useRef(false);

  function markReadIfBottom(currentMessages: Message[], isBottom: boolean) {
    if (!isBottom || currentMessages.length === 0) return;
    const latest = currentMessages[currentMessages.length - 1].createdAt?.toMillis?.() ?? 0;
    if (latest > lastReadAt) {
      localStorage.setItem(storageKey, String(latest));
      setLastReadAt(latest);
    }
  }

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.authorName?.toLowerCase().includes(q) ||
        m.fileName?.toLowerCase().includes(q),
    );
  }, [messages, searchQuery]);

  const unreadCount = useMemo(() => {
    if (!lastReadAt) return 0;
    return messages.filter((m) => {
      if (m.authorId === currentUid) return false;
      const ts = m.createdAt?.toMillis?.() ?? 0;
      return ts > lastReadAt;
    }).length;
  }, [messages, lastReadAt, currentUid]);

  useEffect(() => {
    if (tab !== 'chat' || loading || messages.length === 0) return;
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      const firstUnread = messages.find((m) => (m.createdAt?.toMillis?.() ?? 0) > lastReadAt && m.authorId !== currentUid);
      if (firstUnread && unreadCount > 3) {
        document.getElementById(`msg-${firstUnread.id}`)?.scrollIntoView({ block: 'start' });
      } else {
        bottomRef.current?.scrollIntoView();
      }
      return;
    }
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab, loading, lastReadAt, unreadCount, atBottom, currentUid]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nowAtBottom = distanceFromBottom < 40;
    setAtBottom(nowAtBottom);
    if (tab === 'chat') markReadIfBottom(messages, nowAtBottom);
  }

  function jumpToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function scrollToMessage(messageId: string) {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'background-color 0.2s';
    el.style.backgroundColor = '#eef2ff';
    setTimeout(() => { el.style.backgroundColor = ''; }, 1200);
  }

  async function processFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('파일은 20MB 이하만 업로드할 수 있습니다.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadingName(file.name);
    try {
      const { url, name, size } = await uploadChatFile(file, boardId, 'default', setUploadProgress);
      const isImage = file.type.startsWith('image/');
      setAttachment({ url, name, size, type: isImage ? 'image' : 'file' });
    } catch {
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const fileItem = items.find((item) => item.kind === 'file');
    if (fileItem) {
      const file = fileItem.getAsFile();
      if (file) {
        e.preventDefault();
        processFile(file);
        return;
      }
    }
  }

  function removeAttachment() {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSendError(err: unknown) {
    if (!(err instanceof Error) || err.message !== 'banned') {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`전송 실패: ${msg}`);
      console.error('[chat-send]', err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !attachment) || sending) return;

    const replyTo: MessageReplyTo | undefined = replyingTo
      ? {
          id: replyingTo.id,
          authorName: replyingTo.authorName,
          content: (replyingTo.content || replyingTo.fileName || '').slice(0, 100),
          type: replyingTo.type,
        }
      : undefined;

    if (attachment) {
      setSending(true);
      try {
        await onSend(input.trim(), attachment, replyTo);
        setInput('');
        setAttachment(null);
        setReplyingTo(null);
        stopTyping();
      } catch (err) {
        handleSendError(err);
      } finally {
        setSending(false);
      }
      return;
    }

    const promise = onSend(input.trim(), undefined, replyTo);
    setInput('');
    setReplyingTo(null);
    stopTyping();
    promise.catch(handleSendError);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  function formatTime(msg: Message) {
    if (!msg.createdAt) return '';
    const date = msg.createdAt.toDate?.();
    if (!date) return '';
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  const mediaCount = messages.filter((m) => m.type === 'image' || m.type === 'file').length;

  return (
    <div
      className="flex flex-col h-full border-l border-gray-100 bg-white relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-indigo-50/90 border-2 border-dashed border-indigo-400 rounded-none pointer-events-none">
          <Paperclip size={36} className="text-indigo-400 mb-2" />
          <p className="text-indigo-600 font-semibold text-sm">파일을 여기에 놓으세요</p>
        </div>
      )}

      {/* 탭 헤더 */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            채팅
          </button>
          <button
            onClick={() => setTab('media')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'media' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Images size={12} />
            파일·미디어
            {mediaCount > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${tab === 'media' ? 'bg-white/30' : 'bg-gray-200 text-gray-600'}`}>
                {mediaCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tab === 'chat' && (
            <button
              type="button"
              onClick={() => {
                setShowSearch((v) => {
                  const next = !v;
                  if (!next) setSearchQuery('');
                  return next;
                });
              }}
              className={`p-1 rounded transition-colors focus-visible:outline focus-visible:outline-2 ${
                showSearch ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={showSearch ? '검색 닫기' : '메시지 검색'}
              aria-pressed={showSearch}
            >
              <Search size={14} />
            </button>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            {onlineCount}명
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2"
              aria-label="채팅 숨기기"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {tab === 'chat' && showSearch && (
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="메시지·작성자·파일명 검색"
              autoFocus
              className="w-full text-xs pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-indigo-400"
            />
          </div>
          {searchQuery && (
            <p className="text-[10px] text-gray-500 mt-1 px-1">{filteredMessages.length}건 일치</p>
          )}
        </div>
      )}

      {/* 공지 배너 */}
      {tab === 'chat' && pinnedAnnouncement && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-200">
          <Pin size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-900 whitespace-pre-wrap break-words">{pinnedAnnouncement.content}</p>
            <p className="text-[10px] text-amber-700 mt-0.5">— {pinnedAnnouncement.byName}</p>
          </div>
          {viewerIsHost && (
            <button
              type="button"
              onClick={() => unpinAnnouncement().catch(() => toast.error('공지 해제 실패'))}
              className="flex-shrink-0 text-amber-600 hover:text-amber-900 p-0.5"
              aria-label="공지 해제"
              title="공지 해제"
            >
              <PinOff size={12} />
            </button>
          )}
        </div>
      )}

      {tab === 'media' ? (
        <div className="flex-1 overflow-y-auto">
          <MediaGallery messages={messages} />
        </div>
      ) : (
        <>
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 relative">
            {loading && <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>}
            {!loading && messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">아직 메시지가 없습니다.</p>
            )}
            {!loading && filteredMessages.length === 0 && messages.length > 0 && (
              <p className="text-xs text-gray-400 text-center py-4">검색 결과가 없습니다.</p>
            )}
            {filteredMessages.map((msg) => {
              const isHost = msg.role === 'host';
              const isMine = msg.authorId === currentUid;
              const canPin = viewerIsHost && (msg.type === 'text' || (msg.content && msg.content.trim().length > 0));
              const canReport = !isMine && !isHost;
              const reactions = msg.reactions ?? {};
              const hasReactions = EMOJI_LIST.some(({ key }) => (reactions[key]?.length ?? 0) > 0);

              return (
                <div
                  id={`msg-${msg.id}`}
                  key={msg.id}
                  className={`group flex flex-col w-full min-w-0 ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {!isMine && (
                    <span className="text-xs text-gray-500 mb-0.5 ml-1">
                      {isHost ? (
                        <span className="text-indigo-600 font-semibold">{msg.authorName} (퍼실리테이터)</span>
                      ) : (
                        msg.authorName
                      )}
                    </span>
                  )}

                  {msg.replyTo && (
                    <button
                      type="button"
                      onClick={() => scrollToMessage(msg.replyTo!.id)}
                      className={`max-w-[85%] mb-1 px-2 py-1 rounded-lg text-[11px] border-l-2 border-indigo-400 bg-indigo-50/60 text-left hover:bg-indigo-50 transition-colors ${isMine ? 'self-end' : 'self-start'}`}
                    >
                      <span className="font-semibold text-indigo-600">{msg.replyTo.authorName}</span>
                      <span className="ml-1 text-gray-500 line-clamp-1">{msg.replyTo.content}</span>
                    </button>
                  )}

                  <div className={`relative flex flex-col max-w-[88%]`}>
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : isHost
                          ? 'bg-indigo-50 text-gray-900 border-l-4 border-indigo-500 rounded-bl-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      } ${msg.type === 'image' || msg.type === 'link' ? 'p-0 overflow-hidden' : ''}`}
                    >
                      <MessageAttachment msg={msg} isMine={isMine} />
                    </div>

                    {hasReactions && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {EMOJI_LIST.map(({ key, emoji }) => {
                          const count = reactions[key]?.length ?? 0;
                          if (!count) return null;
                          const iReacted = reactions[key]?.includes(currentUid);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => onToggleReaction(msg.id, key)}
                              className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                                iReacted
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className={`absolute top-full mt-1 z-10 flex items-center gap-0.5 bg-white rounded-full shadow-md border border-gray-100 px-1.5 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ${isMine ? 'right-0' : 'left-0'}`}>
                      {EMOJI_LIST.map(({ key, emoji, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onToggleReaction(msg.id, key)}
                          className={`p-1 rounded-full text-sm leading-none hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 ${reactions[key]?.includes(currentUid) ? 'bg-gray-100' : ''}`}
                          aria-label={label}
                          title={label}
                        >
                          {emoji}
                        </button>
                      ))}
                      <span className="w-px h-4 bg-gray-200 mx-0.5" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors focus-visible:outline focus-visible:outline-2"
                        aria-label="답글"
                        title="답글"
                      >
                        <CornerUpLeft size={13} />
                      </button>
                      {canPin && (
                        <button
                          type="button"
                          onClick={() => handlePinMessage(msg)}
                          className="p-1 rounded-full text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors focus-visible:outline focus-visible:outline-2"
                          aria-label="공지로 고정"
                          title="공지로 고정"
                        >
                          <Pin size={12} />
                        </button>
                      )}
                      {canReport && (
                        <button
                          type="button"
                          onClick={() => setReportTarget(msg)}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline focus-visible:outline-2"
                          aria-label="메시지 신고"
                          title="신고"
                        >
                          <Flag size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(msg)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {!atBottom && unreadCount > 0 && !searchQuery && (
            <button
              type="button"
              onClick={jumpToBottom}
              className="absolute left-1/2 -translate-x-1/2 bottom-32 z-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5"
            >
              ↓ {unreadCount}개 안 읽은 메시지
            </button>
          )}

          <form onSubmit={handleSend} className="px-3 pb-3 pt-2 border-t border-gray-100">
            {/* 답글 바 */}
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-indigo-50 rounded-lg text-xs border-l-2 border-indigo-400">
                <CornerUpLeft size={12} className="text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-indigo-600">{replyingTo.authorName}</span>
                  <span className="block text-gray-500 truncate">{replyingTo.content || replyingTo.fileName || ''}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500"
                  aria-label="답글 취소"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {uploading && (
              <div className="mb-2 px-2.5 py-2 bg-indigo-50 rounded-lg" aria-live="polite">
                <div className="flex items-center justify-between text-xs text-indigo-700 mb-1.5">
                  <span className="flex-1 min-w-0 overflow-hidden" title={uploadingName}>
                    {uploadingName ? truncateFileName(uploadingName) : '파일'} 업로드 중…
                  </span>
                  <span className="flex-shrink-0 font-semibold tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {attachment && !uploading && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                <span className="flex-1 min-w-0 overflow-hidden" title={attachment.name}>
                  {truncateFileName(attachment.name)}
                </span>
                <button type="button" onClick={removeAttachment} className="flex-shrink-0 hover:text-red-500" aria-label="첨부 제거">
                  <X size={14} />
                </button>
              </div>
            )}
            {typingUsers.length > 0 && (
              <p className="text-[11px] text-gray-400 mb-1 px-1 truncate">
                {typingUsers.map((u) => u.name).join(', ')}
                {typingUsers.length === 1 ? '님이' : '님이'} 입력 중…
              </p>
            )}
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); if (e.target.value) startTyping(); else stopTyping(); }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="메시지 입력… (Enter 전송, 이미지 붙여넣기 가능)"
              maxLength={CHAT_MAX_LENGTH}
              rows={2}
              className="resize-none text-sm mb-1"
            />
            {input.length > CHAT_MAX_LENGTH * 0.8 && (
              <p className="text-[11px] text-gray-400 text-right mb-1 tabular-nums">
                {input.length}/{CHAT_MAX_LENGTH}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
                aria-label="파일 첨부"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="submit"
                disabled={sending || uploading || (!input.trim() && !attachment)}
                size="sm"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {uploading ? '업로드 중…' : sending ? '전송 중…' : '전송'}
              </Button>
            </div>
          </form>
        </>
      )}

      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          boardId={boardId}
          targetType="message"
          targetId={reportTarget.id}
          targetSnapshot={reportTarget.content || reportTarget.fileName || ''}
          reporterId={currentUid}
          reporterName={currentName}
        />
      )}
    </div>
  );
}
