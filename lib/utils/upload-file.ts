import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { compressImage } from './compress-image';

// webp 변환 시 애니메이션이 정지되거나 벡터가 깨지는 포맷 — 원본 그대로 업로드.
function isLossyToWebp(file: File): boolean {
  return file.type === 'image/gif' || file.type === 'image/svg+xml';
}

function fileExt(name: string, fallback: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()! : fallback;
}

export async function uploadPostImage(
  file: File,
  boardId: string,
  wsId = 'default'
): Promise<string> {
  const keepOriginal = isLossyToWebp(file);
  const blob = keepOriginal ? file : await compressImage(file);
  const ext = keepOriginal ? fileExt(file.name, 'png') : 'webp';
  const contentType = keepOriginal ? file.type : 'image/webp';
  const path = `workspaces/${wsId}/boards/${boardId}/images/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

export async function uploadChatFile(
  file: File,
  boardId: string,
  wsId = 'default'
): Promise<{ url: string; name: string; size: number }> {
  const isImage = file.type.startsWith('image/');
  const compressToWebp = isImage && !isLossyToWebp(file);
  const blob = compressToWebp ? await compressImage(file) : file;
  const ext = compressToWebp ? 'webp' : fileExt(file.name, 'bin');
  const type = isImage ? 'images' : 'files';
  const path = `workspaces/${wsId}/boards/${boardId}/${type}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: compressToWebp ? 'image/webp' : file.type });
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name, size: file.size };
}
