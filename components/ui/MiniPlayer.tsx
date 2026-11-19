import { Pause, Play, SkipForward } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '@/context/ThemeContext';
import { usePlayback } from '@/context/PlaybackContext';

import { AppText } from './AppText';
import { Artwork } from './Artwork';
import { IconButton } from './IconButton';

export function MiniPlayer() {
  const { snapshot, manager } = usePlayback();
  const router = useRouter();
  const { colors } = useTheme();

  const item = snapshot.current;
  if (!item) return null;

  const progress = snapshot.duration > 0 ? snapshot.position / snapshot.duration : 0;

  return (
    <Pressable
      onPress={() => router.push('/player')}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.elevated, opacity: pressed ? 0.92 : 1 },
      ]}>
      <View style={styles.row}>
        <Artwork
          uri={item.artwork ?? item.thumbnail}
          seed={item.id || item.title}
          size={44}
          radius={10}
        />
        <View style={styles.info}>
          <AppText variant="label" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {item.artist || (item.mediaType === 'video' ? 'Video' : 'Audio')}
          </AppText>
        </View>
        <IconButton
          icon={snapshot.isPlaying ? Pause : Play}
          onPress={() => manager.toggle()}
          size={22}
          color={colors.text}
        />
        {snapshot.activeType === 'audio' ? (
          <IconButton
            icon={SkipForward}
            onPress={() => manager.next()}
            size={20}
            color={colors.textSecondary}
          />
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  track: {
    height: 2,
  },
  fill: {
    height: 2,
  },
});