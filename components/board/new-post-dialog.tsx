'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { PostColor } from '@/lib/types';

const COLORS: { value: PostColor; label: string; className: string }[] = [
  { value: 'yellow', label: '노랑', className: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' },
  { value: 'blue', label: '파랑', className: 'bg-blue-100 border-blue-300 hover:bg-blue-200' },
  { value: 'pink', label: '핑크', className: 'bg-pink-100 border-pink-300 hover:bg-pink-200' },
  { value: 'green', label: '초록', className: 'bg-green-100 border-green-300 hover:bg-green-200' },
  { value: 'purple', label: '보라', className: 'bg-purple-100 border-purple-300 hover:bg-purple-200' },
  { value: 'gray', label: '회색', className: 'bg-gray-100 border-gray-300 hover:bg-gray-200' },
];

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, color: PostColor) => Promise<void>;
}

export function NewPostDialog({ open, onClose, onSubmit }: NewPostDialogProps) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PostColor>('yellow');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(content.trim(), color);
      setContent('');
      setColor('yellow');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>새 포스트 작성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            required
            autoFocus
            className="resize-none"
          />
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${c.className} ${
                  color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-blue-500' : ''
                }`}
                aria-label={c.label}
              />
            ))}
          </div>
          <Button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? '저장 중...' : '포스트 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
