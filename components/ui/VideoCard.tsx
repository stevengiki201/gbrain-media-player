import { Play } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { useVideoThumbnail } from '@/lib/video-thumbnails';

import { AppText } from './AppText';
import { Artwork } from './Artwork';

type VideoCardProps = {
  item: MediaItem;
  width: number;
  onPress: () => void;
  resumePosition?: number;
};

export function VideoCard({ item, width, onPress, resumePosition }: VideoCardProps) {
  const { colors } = useTheme();
  const generatedThumbnail = useVideoThumbnail(item.uri);
  const thumbHeight = Math.round((width * 9) / 16);
  const showResume =
    resumePosition && resumePosition > 5 && item.duration > 0
      ? Math.min(1, resumePosition / 1000 / item.duration)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}>
      <View
        style={[styles.thumb, { width, height: thumbHeight, backgroundColor: colors.surfaceAlt }]}>
        <Artwork
          uri={item.thumbnail}
          source={generatedThumbnail ?? undefined}
          seed={item.id || item.title}
          size={thumbHeight}
          width={width}
          height={thumbHeight}
          radius={12}
        />
        <View style={styles.durationBadge}>
          <AppText variant="caption" color="#FFFFFF">
            {formatDuration(item.duration)}
          </AppText>
        </View>
        {showResume > 0 ? (
          <View style={styles.resumeTrack}>
            <View
              style={[
                styles.resumeFill,
                { width: `${showResume * 100}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={2} style={styles.title}>
        {item.title}
      </AppText>
      <View style={styles.metaRow}>
        <Play size={12} color={colors.textMuted} fill={colors.textMuted} />
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {item.folder ? item.folder.split('/').pop() || 'Video' : 'Video'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 6,
    marginBottom: 2,
  },
  thumb: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  resumeTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  resumeFill: {
    height: 3,
  },
  title: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
});