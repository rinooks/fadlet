'use client';

import { FileIcon, DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { ImageViewer } from '@/components/shared/image-viewer';
import type { Message } from '@/lib/types';
import { formatFileSize } from '@/lib/utils/format-file-size';
import { truncateFileName } from '@/lib/utils/truncate-file-name';

interface MediaGalleryProps {
  messages: Message[];
}

export function MediaGallery({ messages }: MediaGalleryProps) {
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const images = messages.filter((m) => m.type === 'image' && m.fileUrl);
  const files = messages.filter((m) => m.type === 'file' && m.fileUrl);

  if (images.length === 0 && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FileIcon size={32} className="mb-2 opacity-30" />
        <p className="text-xs">공유된 파일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-3">
      {images.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            이미지 ({images.length})
          </p>
          <div className="grid grid-cols-3 gap-1 px-2">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setViewerSrc(img.fileUrl!)}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                aria-label="이미지 크게 보기"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.fileUrl!}
                  alt={img.fileName ?? '이미지'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            파일 ({files.length})
          </p>
          <div className="flex flex-col gap-1 px-2">
            {files.map((file) => (
              <a
                key={file.id}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={file.fileName}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm transition-colors"
              >
                <FileIcon size={16} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 min-w-0 overflow-hidden text-gray-800" title={file.fileName ?? '파일'}>
                  {truncateFileName(file.fileName ?? '파일')}
                </span>
                {file.fileSize !== undefined && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatFileSize(file.fileSize)}
                  </span>
                )}
                <DownloadIcon size={14} className="text-gray-400 flex-shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
    </div>
  );
}
