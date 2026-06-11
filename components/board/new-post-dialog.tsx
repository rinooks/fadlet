'use client';

import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { uploadPostImage } from '@/lib/utils/upload-file';
import { POST_MAX_LENGTH, POST_TITLE_MAX_LENGTH, type PostColor } from '@/lib/types';

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
  /** 이미지가 있으면 다이얼로그가 직접 업로드한 뒤 imageUrl을 전달한다. */
  onSubmit: (content: string, color: PostColor, imageUrl?: string, title?: string) => Promise<void>;
  /** 이미지 업로드 경로용 보드 ID */
  boardId: string;
  defaultColor?: PostColor;
  columnLabel?: string;
  /** 제목 입력 영역 노출 여부 (보드 설정) */
  titleEnabled?: boolean;
}

export function NewPostDialog({ open, onClose, onSubmit, boardId, defaultColor, columnLabel, titleEnabled }: NewPostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PostColor>(defaultColor ?? 'yellow');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

  function handleError(err: unknown) {
    if (!(err instanceof Error) || err.message !== 'banned') {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`포스트 저장 실패: ${msg}`);
      console.error('[new-post]', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    const titleValue = titleEnabled ? title.trim() : undefined;

    if (imageFile) {
      // 이미지 업로드 → 진행률 표시 → 완료 후 포스트 저장
      setLoading(true);
      setUploadProgress(0);
      try {
        const imageUrl = await uploadPostImage(imageFile, boardId, 'default', setUploadProgress);
        await onSubmit(content.trim(), color, imageUrl, titleValue);
        setTitle('');
        setContent('');
        setColor('yellow');
        removeImage();
        onClose();
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
        setUploadProgress(null);
      }
      return;
    }

    // 텍스트 전용: 낙관적 UI — 다이얼로그를 즉시 닫고 백그라운드에서 저장
    const promise = onSubmit(content.trim(), color, undefined, titleValue);
    setTitle('');
    setContent('');
    setColor('yellow');
    onClose();
    promise.catch(handleError);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {columnLabel ? `${columnLabel} — 포스트 작성` : '새 포스트 작성'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {titleEnabled && (
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={POST_TITLE_MAX_LENGTH}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            />
          )}
          <div className="flex flex-col gap-1">
            <Textarea
              placeholder="내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={POST_MAX_LENGTH}
              rows={10}
              autoFocus
              className="resize-none min-h-[280px]"
            />
            <span className="text-xs text-gray-400 self-end tabular-nums">
              {content.length}/{POST_MAX_LENGTH}
            </span>
          </div>

          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden bg-gray-50">
              <Image src={imagePreview} alt="미리보기" width={400} height={200} className="w-full object-contain max-h-40 rounded-lg" />
              {!loading && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              )}
              {uploadProgress !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45" aria-live="polite">
                  <span className="text-white text-xs font-semibold">업로드 중… {uploadProgress}%</span>
                  <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
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
                    color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-indigo-500' : ''
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {uploadProgress !== null ? '업로드 중...' : loading ? '저장 중...' : '포스트 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
