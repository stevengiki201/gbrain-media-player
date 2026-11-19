import type { MediaItem } from '@/lib/types';

export async function hasMediaPermissions(): Promise<boolean> {
  return true;
}

export async function requestMediaPermissions(): Promise<boolean> {
  return true;
}

export async function scanLibrary(): Promise<{
  tracks: MediaItem[];
  videos: MediaItem[];
}> {
  return { tracks: [], videos: [] };
}