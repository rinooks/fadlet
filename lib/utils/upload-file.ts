import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { compressImage } from './compress-image';

export async function uploadPostImage(
  file: File,
  boardId: string,
  wsId = 'default'
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = 'webp';
  const path = `workspaces/${wsId}/boards/${boardId}/images/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, { contentType: 'image/webp' });
  return getDownloadURL(storageRef);
}

export async function uploadChatFile(
  file: File,
  boardId: string,
  wsId = 'default'
): Promise<{ url: string; name: string; size: number }> {
  const isImage = file.type.startsWith('image/');
  const blob = isImage ? await compressImage(file) : file;
  const ext = isImage ? 'webp' : file.name.split('.').pop() ?? 'bin';
  const type = isImage ? 'images' : 'files';
  const path = `workspaces/${wsId}/boards/${boardId}/${type}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: isImage ? 'image/webp' : file.type });
  const url = await getDownloadURL(storageRef);
  return { url, name: file.name, size: file.size };
}
