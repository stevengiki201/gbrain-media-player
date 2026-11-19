import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import type { MediaItem } from '@/lib/types';

const COVER_PATTERN = /(^|[^a-z])(cover|front|folder|album|artwork|art)([^a-z]|$)/i;
const IMAGE_PAGE_SIZE = 500;
const MAX_IMAGES = 4000;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot > 0 ? filename.slice(0, dot) : filename;
}

function folderFromUri(uri: string): string {
  const withoutScheme = uri.replace(/^[a-z]+:\/\//i, '');
  const slash = withoutScheme.lastIndexOf('/');
  if (slash <= 0) return '';
  return withoutScheme.slice(0, slash);
}

function folderLabel(folder: string | null): string {
  if (!folder) return '';
  const parts = folder.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function containsToken(haystack: string, token: string): boolean {
  return token.length > 2 && haystack.includes(token);
}

function matchesCover(candidate: MediaLibrary.Asset, track: MediaItem): boolean {
  const filename = normalize(stripExtension(candidate.filename));
  if (COVER_PATTERN.test(filename)) return true;
  const album = normalize(track.album);
  const title = normalize(track.title);
  const artist = normalize(track.artist);
  const trackFile = normalize(stripExtension(track.fileName));
  return (
    containsToken(filename, album) ||
    containsToken(filename, title) ||
    containsToken(filename, artist) ||
    containsToken(trackFile, filename)
  );
}

async function loadImages(): Promise<MediaLibrary.Asset[]> {
  const images: MediaLibrary.Asset[] = [];
  let after: string | undefined;

  while (images.length < MAX_IMAGES) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      first: Math.min(IMAGE_PAGE_SIZE, MAX_IMAGES - images.length),
      after,
      sortBy: [['creationTime', false]],
      resolveWithFullInfo: true,
    });
    images.push(...page.assets);
    if (!page.hasNextPage) break;
    after = page.endCursor;
  }

  return images;
}

export async function applyAlbumArt(tracks: MediaItem[]): Promise<void> {
  if (Platform.OS === 'web' || tracks.length === 0) return;

  let images: MediaLibrary.Asset[];
  try {
    images = await loadImages();
  } catch {
    return;
  }

  const byFolder = new Map<string, MediaLibrary.Asset[]>();
  for (const image of images) {
    const folder = folderFromUri(image.uri);
    if (!folder) continue;
    const list = byFolder.get(folder) ?? [];
    list.push(image);
    byFolder.set(folder, list);
  }

  for (const track of tracks) {
    if (!track.album) {
      track.album = folderLabel(track.folder) || track.artist || 'Unknown album';
    }

    const folder = folderFromUri(track.folder ?? '');
    const candidates = byFolder.get(folder) ?? [];
    const cover =
      candidates.find((candidate) => COVER_PATTERN.test(normalize(stripExtension(candidate.filename)))) ??
      candidates.find((candidate) => matchesCover(candidate, track)) ??
      images.find((candidate) => matchesCover(candidate, track));

    if (cover) {
      track.artwork = cover.uri;
    }
  }
}
