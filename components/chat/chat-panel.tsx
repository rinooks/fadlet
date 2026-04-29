'use client';

import { useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageAttachment } from './message-attachment';
import { uploadChatFile } from '@/lib/utils/upload-file';
import type { Message, UserRole } from '@/lib/types';

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
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className="flex flex-col h-full border-l border-gray-100 bg-white">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-900">실시간 채팅</span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          {onlineCount}명 접속 중
        </span>
      </div>

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
          placeholder="메시지 입력... (Enter 전송)"
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
            {uploading ? '업로드 중...' : sending ? '전송 중...' : '전송'}
          </Button>
        </div>
      </form>
    </div>
  );
}
