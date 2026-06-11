'use client';

import { FileIcon, DownloadIcon, ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';
import { ImageViewer } from '@/components/shared/image-viewer';
import { CollapsibleText } from '@/components/shared/collapsible-text';
import type { Message } from '@/lib/types';
import { formatFileSize } from '@/lib/utils/format-file-size';
import { truncateFileName } from '@/lib/utils/truncate-file-name';

interface MessageAttachmentProps {
  msg: Message;
  isMine: boolean;
}

export function MessageAttachment({ msg, isMine }: MessageAttachmentProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (msg.type === 'image' && msg.fileUrl) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="block w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 rounded-xl"
          aria-label="이미지 크게 보기"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={msg.fileUrl}
            alt={msg.fileName ?? '이미지'}
            className="rounded-xl object-contain max-h-60 w-full bg-black/5"
          />
        </button>
        {msg.content && (
          <CollapsibleText
            content={msg.content}
            className="mt-1 text-sm break-words whitespace-pre-wrap"
            isMine={isMine}
            viewerTitle={msg.authorName}
          />
        )}
        <ImageViewer
          src={viewerOpen ? msg.fileUrl : null}
          alt={msg.fileName ?? '이미지'}
          onClose={() => setViewerOpen(false)}
        />
      </div>
    );
  }

  if (msg.type === 'file' && msg.fileUrl) {
    return (
      <a
        href={msg.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
          isMine
            ? 'border-indigo-400 bg-indigo-500/20 text-white'
            : 'border-gray-200 bg-white text-gray-800'
        }`}
        download={msg.fileName}
      >
        <FileIcon size={16} className="flex-shrink-0" />
        <span className="flex-1 min-w-0 overflow-hidden" title={msg.fileName ?? '파일'}>
          {truncateFileName(msg.fileName ?? '파일')}
        </span>
        <span className={`text-xs flex-shrink-0 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
          {msg.fileSize ? formatFileSize(msg.fileSize) : ''}
        </span>
        <DownloadIcon size={14} className="flex-shrink-0" />
      </a>
    );
  }

  if (msg.type === 'link' && msg.linkPreview) {
    const p = msg.linkPreview;
    return (
      <div className="flex flex-col gap-1">
        {msg.content && (
          <CollapsibleText
            content={msg.content}
            className="text-sm break-words whitespace-pre-wrap"
            isMine={isMine}
            viewerTitle={msg.authorName}
          />
        )}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block rounded-xl border overflow-hidden text-sm no-underline ${
            isMine ? 'border-indigo-400' : 'border-gray-200'
          }`}
        >
          {p.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={p.image}
              alt={p.title}
              className="w-full object-cover max-h-28"
            />
          )}
          <div className={`px-3 py-2 ${isMine ? 'bg-indigo-500/20' : 'bg-gray-50'}`}>
            <p className={`font-semibold truncate ${isMine ? 'text-white' : 'text-gray-900'}`}>
              {p.title}
            </p>
            {p.description && (
              <p className={`text-xs line-clamp-2 mt-0.5 ${isMine ? 'text-indigo-100' : 'text-gray-500'}`}>
                {p.description}
              </p>
            )}
            <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
              <ExternalLinkIcon size={10} />
              {p.siteName}
            </p>
          </div>
        </a>
      </div>
    );
  }

  return (
    <CollapsibleText
      content={msg.content}
      className="text-sm break-words whitespace-pre-wrap"
      isMine={isMine}
      viewerTitle={msg.authorName}
    />
  );
}
