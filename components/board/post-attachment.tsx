'use client';

import {
  Download,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { getFileKind, type FileKind } from '@/lib/utils/file-kind';
import { formatFileSize } from '@/lib/utils/format-file-size';
import { truncateFileName } from '@/lib/utils/truncate-file-name';

/** 파일 성격별 아이콘 + 배지 색상 */
const KIND_STYLE: Record<FileKind, { Icon: LucideIcon; badge: string }> = {
  pdf: { Icon: FileText, badge: 'bg-red-100 text-red-700' },
  ppt: { Icon: Presentation, badge: 'bg-orange-100 text-orange-700' },
  doc: { Icon: FileText, badge: 'bg-blue-100 text-blue-700' },
  sheet: { Icon: FileSpreadsheet, badge: 'bg-emerald-100 text-emerald-700' },
  hwp: { Icon: FileText, badge: 'bg-teal-100 text-teal-700' },
  image: { Icon: FileImage, badge: 'bg-purple-100 text-purple-700' },
  video: { Icon: FileVideo, badge: 'bg-pink-100 text-pink-700' },
  audio: { Icon: FileAudio, badge: 'bg-indigo-100 text-indigo-700' },
  archive: { Icon: FileArchive, badge: 'bg-amber-100 text-amber-700' },
  text: { Icon: FileText, badge: 'bg-gray-100 text-gray-700' },
  code: { Icon: FileCode, badge: 'bg-slate-200 text-slate-700' },
  file: { Icon: FileIcon, badge: 'bg-gray-100 text-gray-700' },
};

interface PostAttachmentChipProps {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  className?: string;
}

/** 저장된 포스트 첨부파일을 성격(아이콘·라벨)과 함께 보여주는 다운로드 칩. */
export function PostAttachmentChip({ fileUrl, fileName, fileSize, fileType, className }: PostAttachmentChipProps) {
  const { kind, label } = getFileKind(fileType, fileName);
  const { Icon, badge } = KIND_STYLE[kind];
  // 방어적: 우리 업로드는 https Storage URL만 생성한다. javascript:/data: 등 비정상 스킴은 링크하지 않는다.
  const safeUrl = /^https?:\/\//i.test(fileUrl) ? fileUrl : undefined;

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      onClick={(e) => e.stopPropagation()}
      className={`group flex items-center gap-2 rounded-lg border border-gray-200 bg-white/80 px-2.5 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-white ${className ?? ''}`}
      title={fileName}
    >
      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${badge}`}>
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={`rounded px-1 text-[10px] font-bold leading-tight ${badge}`}>{label}</span>
          <span className="truncate text-xs font-medium text-gray-800">{truncateFileName(fileName)}</span>
        </span>
        {fileSize != null && (
          <span className="text-[10px] text-gray-400">{formatFileSize(fileSize)}</span>
        )}
      </span>
      <Download size={14} className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600" />
    </a>
  );
}
