import { AudioLines, MoreVertical } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/lib/format';
import type { MediaItem } from '@/lib/types';

import { AppText } from './AppText';
import { Artwork } from './Artwork';

type SongRowProps = {
  item: MediaItem;
  onPress: () => void;
  onMore?: () => void;
  isActive?: boolean;
  isPlaying?: boolean;
  showArtwork?: boolean;
  subtitle?: string;
  showAlbum?: boolean;
};

export function SongRow({
  item,
  onPress,
  onMore,
  isActive,
  isPlaying,
  showArtwork = true,
  subtitle,
  showAlbum = true,
}: SongRowProps) {
  const { colors } = useTheme();

  const secondary = subtitle ?? (item.artist || 'Unknown Artist');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}>
      {showArtwork ? (
        <Artwork uri={item.artwork} seed={item.id || item.title} size={48} radius={10} />
      ) : null}
      <View style={styles.info}>
        <AppText
          variant="label"
          numberOfLines={1}
          color={isActive ? colors.accent : colors.text}>
          {item.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.sub}>
          {secondary}
        </AppText>
        {showAlbum && item.album ? (
          <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
            {item.album}
          </AppText>
        ) : null}
      </View>
      {isActive ? (
        <AudioLines size={18} color={colors.accent} strokeWidth={2.5} />
      ) : (
        <AppText variant="caption" color={colors.textMuted}>
          {formatDuration(item.duration)}
        </AppText>
      )}
      {onMore ? (
        <Pressable onPress={onMore} hitSlop={8} style={styles.more}>
          <MoreVertical size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 12,
  },
  info: {
    flex: 1,
  },
  sub: {
    marginTop: 2,
  },
  more: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});