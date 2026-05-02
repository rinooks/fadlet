/**
 * 파일명을 maxLength 이하로 줄이되 확장자는 항상 표시한다.
 * 예) "verylongfilename.pdf" → "verlongfil...pdf"
 */
export function truncateFileName(name: string, maxLength = 22): string {
  if (name.length <= maxLength) return name;

  const dotIndex = name.lastIndexOf('.');
  const ext = dotIndex > 0 ? name.slice(dotIndex) : '';
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;

  const keepChars = maxLength - ext.length - 3; // 3 = "..."
  if (keepChars <= 0) return `...${ext}`;

  return `${base.slice(0, keepChars)}...${ext}`;
}
