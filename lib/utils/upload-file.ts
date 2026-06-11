import { getDownloadURL, ref, uploadBytesResumable, type StorageReference } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { compressImage } from './compress-image';

/** 업로드 진행률(0~100)을 전달받는 콜백 */
export type UploadProgressCallback = (percent: number) => void;

// webp 변환 시 애니메이션이 정지되거나 벡터가 깨지는 포맷 — 원본 그대로 업로드.
function isLossyToWebp(file: File): boolean {
  return file.type === 'image/gif' || file.type === 'image/svg+xml';
}

function fileExt(name: string, fallback: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()! : fallback;
}

/**
 * Storage 업로드를 진행률과 함께 수행한다.
 * uploadBytesResumable의 state_changed 이벤트로 바이트 전송률을 퍼센트로 환산해 콜백한다.
 */
function uploadWithProgress(
  storageRef: StorageReference,
  blob: Blob,
  contentType: string,
  onProgress?: UploadProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType });
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      () => resolve(),
    );
  });
}

export async function uploadPostImage(
  file: File,
  boardId: string,
  wsId = 'default',
  onProgress?: UploadProgressCallback,
): Promise<string> {
  onProgress?.(0);
  const keepOriginal = isLossyToWebp(file);
  const blob = keepOriginal ? file : await compressImage(file);
  const ext = keepOriginal ? fileExt(file.name, 'png') : 'webp';
  const contentType = keepOriginal ? file.type : 'image/webp';
  const path = `workspaces/${wsId}/boards/${boardId}/images/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadWithProgress(storageRef, blob, contentType, onProgress);
  return getDownloadURL(storageRef);
}

export async function uploadChatFile(
  file: File,
  boardId: string,
  wsId = 'default',
  onProgress?: UploadProgressCallback,
): Promise<{ url: string; name: string; size: number }> {
  onProgress?.(0);
  const isImage = file.type.startsWith('image/');
  const compressToWebp = isImage && !isLossyToWebp(file);
  const blob = compressToWebp ? await compressImage(file) : file;
  const ext = compressToWebp ? 'webp' : fileExt(file.name, 'bin');
  const type = isImage ? 'images' : 'files';
  const path = `workspaces/${wsId}/boards/${boardId}/${type}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadWithProgress(storageRef, blob, compressToWebp ? 'image/webp' : file.type, onProgress);
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name, size: file.size };
}
