'use client';

import { Paperclip, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { uploadPostImage, uploadPostFile } from '@/lib/utils/upload-file';
import { getFileKind } from '@/lib/utils/file-kind';
import { formatFileSize } from '@/lib/utils/format-file-size';
import { POST_MAX_LENGTH, POST_TITLE_MAX_LENGTH, type PostAttachment, type PostColor } from '@/lib/types';

const IMAGE_MAX = 10 * 1024 * 1024;
const FILE_MAX = 20 * 1024 * 1024;

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
  /**
   * 이미지/파일이 있으면 다이얼로그가 직접 업로드한 뒤 결과를 전달한다.
   * - 이미지: imageUrl
   * - 비이미지 파일: attachment(파일 URL·이름·크기·MIME 타입)
   */
  onSubmit: (content: string, color: PostColor, imageUrl?: string, title?: string, attachment?: PostAttachment) => Promise<void>;
  /** 이미지·파일 업로드 경로용 보드 ID */
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
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttach() {
    setAttachFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /** 선택·붙여넣기로 들어온 파일을 이미지/일반 파일로 분기해 첨부한다. (한 번에 하나) */
  function acceptFile(file: File) {
    if (file.type.startsWith('image/')) {
      if (file.size > IMAGE_MAX) {
        toast.error('이미지는 10MB 이하만 업로드할 수 있습니다.');
        return;
      }
      removeAttach();
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      if (file.size > FILE_MAX) {
        toast.error('파일은 20MB 이하만 업로드할 수 있습니다.');
        return;
      }
      removeImage();
      setAttachFile(file);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  }

  /** 드래그앤드롭으로 이미지/파일 업로드. */
  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      if (!dragOver) setDragOver(true);
    }
  }
  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) acceptFile(files[0]);
  }

  /** Ctrl+V 붙여넣기로 이미지/파일 업로드. 텍스트 붙여넣기는 기본 동작 유지. */
  function handlePaste(e: React.ClipboardEvent) {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      acceptFile(files[0]);
    }
  }

  function handleError(err: unknown) {
    if (!(err instanceof Error) || err.message !== 'banned') {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      toast.error(`포스트 저장 실패: ${msg}`);
      console.error('[new-post]', err);
    }
  }

  function resetAll() {
    setTitle('');
    setContent('');
    setColor('yellow');
    removeImage();
    removeAttach();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imageFile && !attachFile) return;

    const titleValue = titleEnabled ? title.trim() : undefined;

    if (imageFile) {
      // 이미지 업로드 → 진행률 표시 → 완료 후 포스트 저장
      setLoading(true);
      setUploadProgress(0);
      try {
        const imageUrl = await uploadPostImage(imageFile, boardId, 'default', setUploadProgress);
        await onSubmit(content.trim(), color, imageUrl, titleValue);
        resetAll();
        onClose();
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
        setUploadProgress(null);
      }
      return;
    }

    if (attachFile) {
      // 파일 업로드 → 진행률 표시 → 완료 후 포스트 저장
      setLoading(true);
      setUploadProgress(0);
      try {
        const up = await uploadPostFile(attachFile, boardId, 'default', setUploadProgress);
        await onSubmit(content.trim(), color, undefined, titleValue, {
          fileUrl: up.url,
          fileName: up.name,
          fileSize: up.size,
          fileType: up.type,
        });
        resetAll();
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
    resetAll();
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
        <form
          onSubmit={handleSubmit}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative flex min-w-0 flex-col gap-4"
        >
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/85">
              <span className="text-sm font-semibold text-indigo-700">여기에 놓아 업로드</span>
            </div>
          )}
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

          {/* 파일(비이미지) 미리보기 */}
          {attachFile && (
            <div className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                {getFileKind(attachFile.type, attachFile.name).label}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-gray-800">{attachFile.name}</span>
                <span className="text-[10px] text-gray-400">{formatFileSize(attachFile.size)}</span>
              </span>
              {!loading && (
                <button
                  type="button"
                  onClick={removeAttach}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-700"
                  aria-label="첨부 제거"
                >
                  <X size={14} />
                </button>
              )}
              {uploadProgress !== null && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/45" aria-live="polite">
                  <span className="text-xs font-semibold text-white">업로드 중… {uploadProgress}%</span>
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
              aria-label="이미지·파일 첨부"
              title="이미지·파일 첨부 (붙여넣기도 가능)"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile && !attachFile)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {uploadProgress !== null ? '업로드 중...' : loading ? '저장 중...' : '포스트 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
