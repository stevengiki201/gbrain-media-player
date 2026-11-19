import type { ImageProps } from 'expo-image';
import { createVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

type ThumbnailSource = NonNullable<ImageProps['source']>;

const resolvedThumbnails = new Map<string, ImageProps['source']>();
const pendingThumbnails = new Map<string, Promise<ImageProps['source']>>();

async function generateThumbnail(uri: string): Promise<ImageProps['source']> {
  if (Platform.OS === 'web') return null;

  const player = createVideoPlayer(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Thumbnail generation timed out')), 8000);
  });

  try {
    await Promise.race([player.replaceAsync(uri), timeout]);
    const [thumbnail] = await player.generateThumbnailsAsync([0], { maxWidth: 480 });
    return thumbnail ?? null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
    player.release();
  }
}

function getThumbnail(uri: string): Promise<ImageProps['source']> {
  const resolved = resolvedThumbnails.get(uri);
  if (resolved !== undefined) return Promise.resolve(resolved);

  const pending = pendingThumbnails.get(uri);
  if (pending) return pending;

  const promise = generateThumbnail(uri).then((source) => {
    resolvedThumbnails.set(uri, source);
    pendingThumbnails.delete(uri);
    return source;
  });
  pendingThumbnails.set(uri, promise);
  return promise;
}

export function useVideoThumbnail(uri: string | null | undefined): ThumbnailSource | null {
  const [source, setSource] = useState<ImageProps['source']>(() =>
    uri ? resolvedThumbnails.get(uri) ?? null : null,
  );

  useEffect(() => {
    let active = true;
    if (!uri) {
      setSource(null);
      return () => {
        active = false;
      };
    }

    const cached = resolvedThumbnails.get(uri);
    if (cached !== undefined) {
      setSource(cached);
    } else {
      setSource(null);
      void getThumbnail(uri).then((next) => {
        if (active) setSource(next);
      });
    }

    return () => {
      active = false;
    };
  }, [uri]);

  return source ?? null;
}
