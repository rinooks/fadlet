/** 첨부파일을 성격별로 분류해 라벨/아이콘 선택에 쓴다. */
export type FileKind =
  | 'pdf'
  | 'ppt'
  | 'doc'
  | 'sheet'
  | 'hwp'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'text'
  | 'code'
  | 'file';

export interface FileKindInfo {
  kind: FileKind;
  /** 배지에 표시할 짧은 한국어/영문 라벨 */
  label: string;
}

function extOf(name?: string): string {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

const CODE_EXTS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'rb',
  'php', 'html', 'css', 'scss', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql', 'kt', 'swift',
]);
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2']);

/**
 * MIME 타입과 파일명 확장자로 파일 성격을 판단한다.
 * 오피스/한글 문서는 MIME이 generic하게 오는 경우가 많아 확장자를 우선 참고한다.
 */
export function getFileKind(fileType?: string, fileName?: string): FileKindInfo {
  const type = (fileType ?? '').toLowerCase();
  const ext = extOf(fileName);

  // 한글(HWP) — 한국 시장 핵심
  if (ext === 'hwp' || ext === 'hwpx' || type.includes('hwp')) return { kind: 'hwp', label: '한글' };

  // PDF
  if (ext === 'pdf' || type.includes('pdf')) return { kind: 'pdf', label: 'PDF' };

  // 프레젠테이션(PPT)
  if (ext === 'ppt' || ext === 'pptx' || type.includes('presentation') || type.includes('powerpoint')) {
    return { kind: 'ppt', label: 'PPT' };
  }

  // 스프레드시트(Excel/CSV)
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv' || type.includes('spreadsheet') || type.includes('excel')) {
    return { kind: 'sheet', label: ext === 'csv' ? 'CSV' : 'Excel' };
  }

  // 워드 문서
  if (ext === 'doc' || ext === 'docx' || type.includes('msword') || type.includes('wordprocessing')) {
    return { kind: 'doc', label: 'Word' };
  }

  if (type.startsWith('image/')) return { kind: 'image', label: '이미지' };
  if (type.startsWith('video/')) return { kind: 'video', label: '영상' };
  if (type.startsWith('audio/')) return { kind: 'audio', label: '오디오' };

  if (ARCHIVE_EXTS.has(ext) || type.includes('zip') || type.includes('compressed')) {
    return { kind: 'archive', label: '압축' };
  }

  if (CODE_EXTS.has(ext)) return { kind: 'code', label: '코드' };
  if (ext === 'txt' || type.startsWith('text/')) return { kind: 'text', label: '텍스트' };

  return { kind: 'file', label: ext ? ext.toUpperCase() : '파일' };
}
