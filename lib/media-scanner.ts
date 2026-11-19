import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import { applyAlbumArt } from '@/lib/album-art';
import type { MediaItem, MediaType } from '@/lib/types';

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|wav|flac|opus|wma|amr|mid|midi)$/i;
const VIDEO_EXT = /\.(mp4|mkv|webm|avi|mov|3gp|flv|m4v|mpeg|mpg|ts)$/i;

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
}

function parseTitleArtist(filename: string): { title: string; artist: string } {
  const base = stripExtension(filename).replace(/_/g, ' ').trim();
  const match = base.match(/^(.+?)\s+-\s+(.+)$/);
  if (match) {
    return { title: match[2].trim(), artist: match[1].trim() };
  }
  return { title: base || 'Unknown', artist: '' };
}

function folderFromUri(uri: string): string {
  const withoutScheme = uri.replace(/^file:\/\//, '');
  const slash = withoutScheme.lastIndexOf('/');
  if (slash <= 0) return '';
  return withoutScheme.slice(0, slash);
}

function yearFromTimestamp(ms: number): number | null {
  if (!ms) return null;
  const date = new Date(ms);
  const year = date.getFullYear();
  return Number.isFinite(year) && year > 0 ? year : null;
}

async function assetToMedia(
  asset: MediaLibrary.Asset,
  mediaType: MediaType,
): Promise<MediaItem> {
  let uri = asset.uri;
  if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset.id);
      uri = info.localUri ?? uri;
    } catch {
      // keep original uri
    }
  }

  const { title, artist } = parseTitleArtist(asset.filename);

  return {
    id: asset.id,
    mediaType,
    title: mediaType === 'video' ? stripExtension(asset.filename) : title,
    artist: mediaType === 'video' ? '' : artist,
    album: '',
    duration: asset.duration ?? 0,
    uri,
    artwork: null,
    thumbnail: null,
    albumId: asset.albumId ?? null,
    folder: folderFromUri(uri),
    fileName: asset.filename,
    year: yearFromTimestamp(asset.creationTime),
    genre: null,
    size: null,
    addedAt: asset.creationTime ?? 0,
    modifiedAt: asset.modificationTime ?? 0,
  };
}

async function scanType(mediaType: 'audio' | 'video'): Promise<MediaItem[]> {
  const assets: MediaLibrary.Asset[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: 200,
      after,
      sortBy: [['creationTime', false]],
    });
    assets.push(...page.assets);
    hasNextPage = page.hasNextPage;
    after = page.endCursor;
  }

  const mapped = await Promise.all(assets.map((asset) => assetToMedia(asset, mediaType)));
  if (mediaType === 'audio') {
    await applyAlbumArt(mapped);
    return mapped.filter((item) => AUDIO_EXT.test(item.fileName) || item.duration > 0);
  }
  return mapped.filter((item) => VIDEO_EXT.test(item.fileName) || item.duration > 0);
}

export async function hasMediaPermissions(): Promise<boolean> {
  const permission = await MediaLibrary.getPermissionsAsync(false, ['audio', 'video', 'photo']);
  return permission.granted;
}

export async function requestMediaPermissions(): Promise<boolean> {
  const permission = await MediaLibrary.requestPermissionsAsync(false, [
    'audio',
    'video',
    'photo',
  ]);
  return permission.granted;
}

export async function scanLibrary(): Promise<{
  tracks: MediaItem[];
  videos: MediaItem[];
}> {
  const [tracks, videos] = await Promise.all([scanType('audio'), scanType('video')]);
  return { tracks, videos };
}