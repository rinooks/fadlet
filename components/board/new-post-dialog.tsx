'use client';

import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
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
  onSubmit: (content: string, color: PostColor, imageFile?: File) => Promise<void>;
  defaultColor?: PostColor;
  columnLabel?: string;
}

export function NewPostDialog({ open, onClose, onSubmit, defaultColor, columnLabel }: NewPostDialogProps) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PostColor>(defaultColor ?? 'yellow');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('이미지는 10MB 이하만 업로드할 수 있습니다.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      await onSubmit(content.trim(), color, imageFile ?? undefined);
      setContent('');
      setColor('yellow');
      removeImage();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {columnLabel ? `${columnLabel} — 포스트 작성` : '새 포스트 작성'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea
            placeholder="내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
            className="resize-none"
          />

          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden">
              <Image src={imagePreview} alt="미리보기" width={400} height={200} className="w-full object-cover max-h-40 rounded-lg" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${c.className} ${
                    color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-blue-500' : ''
                  }`}
                  aria-label={c.label}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 rounded p-1"
              aria-label="이미지 첨부"
            >
              <ImageIcon size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? '저장 중...' : '포스트 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
