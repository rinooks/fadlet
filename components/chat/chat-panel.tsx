'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, X, Images } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageAttachment } from './message-attachment';
import { MediaGallery } from './media-gallery';
import { uploadChatFile } from '@/lib/utils/upload-file';
import type { Message, UserRole } from '@/lib/types';

type Tab = 'chat' | 'media';

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'file';
}

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  onlineCount: number;
  onSend: (content: string, fileAttachment?: FileAttachment) => Promise<void>;
  currentUid: string;
  currentRole: UserRole;
  boardId: string;
}

export function ChatPanel({ messages, loading, onlineCount, onSend, currentUid, currentRole, boardId }: ChatPanelProps) {
  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (tab === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  async function processFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('파일은 20MB 이하만 업로드할 수 있습니다.');
      return;
    }
    setUploading(true);
    try {
      const { url, name, size } = await uploadChatFile(file, boardId);
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !attachment) || sending) return;
    setSending(true);
    try {
      await onSend(input.trim(), attachment ?? undefined);
      setInput('');
      setAttachment(null);
    } finally {
      setSending(false);
    }
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
      {/* 드래그 오버레이 */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-50/90 border-2 border-dashed border-blue-400 rounded-none pointer-events-none">
          <Paperclip size={36} className="text-blue-400 mb-2" />
          <p className="text-blue-600 font-semibold text-sm">파일을 여기에 놓으세요</p>
        </div>
      )}

      {/* 탭 헤더 */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            채팅
          </button>
          <button
            onClick={() => setTab('media')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'media'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
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
        <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          {onlineCount}명
        </span>
      </div>

      {/* 탭 컨텐츠 */}
      {tab === 'media' ? (
        <div className="flex-1 overflow-y-auto">
          <MediaGallery messages={messages} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loading && <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>}
            {!loading && messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">아직 메시지가 없습니다.</p>
            )}
            {messages.map((msg) => {
              const isHost = msg.role === 'host';
              const isMine = msg.authorId === currentUid;
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <span className="text-xs text-gray-500 mb-0.5 ml-1">
                      {isHost ? (
                        <span className="text-blue-600 font-semibold">{msg.authorName} (운영자)</span>
                      ) : (
                        msg.authorName
                      )}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : isHost
                        ? 'bg-blue-50 text-gray-900 border-l-4 border-blue-500 rounded-bl-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    } ${msg.type === 'image' || msg.type === 'link' ? 'p-0 overflow-hidden' : ''}`}
                  >
                    <MessageAttachment msg={msg} isMine={isMine} />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(msg)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="px-3 pb-3 pt-2 border-t border-gray-100">
            {attachment && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-blue-50 rounded-lg text-xs text-blue-700">
                <span className="flex-1 truncate">{attachment.name}</span>
                <button type="button" onClick={removeAttachment} className="flex-shrink-0 hover:text-red-500" aria-label="첨부 제거">
                  <X size={14} />
                </button>
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="메시지 입력… (Enter 전송, 이미지 붙여넣기 가능)"
              maxLength={500}
              rows={2}
              className="resize-none text-sm mb-2"
            />
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {uploading ? '업로드 중…' : sending ? '전송 중…' : '전송'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
