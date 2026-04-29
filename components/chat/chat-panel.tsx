'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message, UserRole } from '@/lib/types';

interface ChatPanelProps {
  messages: Message[];
  loading: boolean;
  onlineCount: number;
  onSend: (content: string) => Promise<void>;
  currentUid: string;
  currentRole: UserRole;
}

export function ChatPanel({ messages, loading, onlineCount, onSend, currentUid, currentRole }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput('');
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
                className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm break-words ${
                  isMine
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : isHost
                    ? 'bg-blue-50 text-gray-900 border-l-4 border-blue-500 rounded-bl-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(msg)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-3 pb-3 pt-2 border-t border-gray-100">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력... (Enter 전송)"
          maxLength={500}
          rows={2}
          className="resize-none text-sm mb-2"
        />
        <Button
          type="submit"
          disabled={sending || !input.trim()}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          전송
        </Button>
      </form>
    </div>
  );
}
