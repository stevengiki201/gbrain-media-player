import { ChevronDown, Heart, ListMusic, Volume2, VolumeX } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PlayerControls } from '@/components/ui/PlayerControls';
import { Screen } from '@/components/ui/Screen';
import { Slider } from '@/components/ui/Slider';
import { SongRow } from '@/components/ui/SongRow';
import {
  usePlaybackManager,
  usePlaybackSnapshot,
} from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/lib/format';
import { useStore } from '@/store/StoreContext';

const PlayerScreen = observer(() => {
  const store = useStore();
  const manager = usePlaybackManager();
  const snapshot = usePlaybackSnapshot();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);

  const item = snapshot.current;
  const artSize = Math.min(width - 72, 360);

  if (!item) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <IconButton icon={ChevronDown} onPress={() => router.back()} color={colors.text} size={28} />
        </View>
        <EmptyState icon={ListMusic} title="Nothing playing" subtitle="Pick a song to start listening." />
      </Screen>
    );
  }

  const duration = snapshot.duration || item.duration || 0;
  const progress = seekValue ?? (duration > 0 ? snapshot.position / duration : 0);
  const isFavorite = store.favorites.isFavorite(item.id);

  const toggleFavorite = () => {
    void store.favorites.toggle(item.id);
  };

  const openQueue = () => setQueueOpen(true);

  return (
    <Screen backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton icon={ChevronDown} onPress={() => router.back()} color={colors.text} size={28} />
          <View style={styles.topCenter}>
            <AppText variant="caption" color={colors.textSecondary}>
              {snapshot.activeType === 'video' ? 'Now Playing' : 'Now Playing'}
            </AppText>
          </View>
          <IconButton icon={ListMusic} onPress={openQueue} color={colors.text} size={22} />
        </View>

        <View style={styles.artWrap}>
          <Artwork
            uri={item.artwork ?? item.thumbnail}
            seed={item.id || item.title}
            size={artSize}
            radius={24}
          />
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleInfo}>
            <AppText variant="title" numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {item.artist || item.album || (item.mediaType === 'video' ? 'Video' : 'Unknown Artist')}
            </AppText>
          </View>
          <IconButton
            icon={Heart}
            onPress={toggleFavorite}
            size={26}
            color={isFavorite ? colors.accent : colors.textSecondary}
          />
        </View>

        <View style={styles.progressBlock}>
          <Slider
            value={progress}
            onValueChange={(value) => setSeekValue(value)}
            onSlidingComplete={(value) => {
              setSeekValue(null);
              manager.seek(value * duration);
            }}
          />
          <View style={styles.timeRow}>
            <AppText variant="caption" color={colors.textMuted}>
              {formatDuration(seekValue != null ? seekValue * duration : snapshot.position)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {formatDuration(duration)}
            </AppText>
          </View>
        </View>

        <PlayerControls
          isPlaying={snapshot.isPlaying}
          isShuffle={snapshot.shuffle}
          repeat={snapshot.repeat}
          showQueueControls={snapshot.activeType === 'audio'}
          onToggle={() => manager.toggle()}
          onNext={() => manager.next()}
          onPrevious={() => manager.previous()}
          onShuffle={() => manager.toggleShuffle()}
          onRepeat={() => manager.cycleRepeat()}
        />

        <View style={styles.volumeRow}>
          <IconButton
            icon={snapshot.muted || snapshot.volume === 0 ? VolumeX : Volume2}
            onPress={() => manager.toggleMute()}
            size={20}
            color={colors.textSecondary}
          />
          <View style={styles.volumeSlider}>
            <Slider
              value={snapshot.muted ? 0 : snapshot.volume}
              onValueChange={(value) => manager.setVolume(value)}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={queueOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setQueueOpen(false)}>
        <Pressable
          style={[styles.queueOverlay, { backgroundColor: colors.scrim }]}
          onPress={() => setQueueOpen(false)}>
          <Pressable
            style={[styles.queueSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.queueHeader}>
              <AppText variant="heading">Queue</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {snapshot.queue.length} tracks
              </AppText>
            </View>
            <ScrollView style={styles.queueList}>
              {snapshot.queue.map((track, index) => (
                <View key={`${track.id}-${index}`} style={styles.queueItem}>
                  <SongRow
                    item={track}
                    onPress={() => {
                      manager.playAudio(track, snapshot.queue);
                      setQueueOpen(false);
                    }}
                    isActive={index === snapshot.index}
                    isPlaying={index === snapshot.index && snapshot.isPlaying}
                    showAlbum={false}
                    onMore={undefined}
                  />
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
});

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  topCenter: {
    alignItems: 'center',
  },
  artWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  progressBlock: {
    marginTop: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  volumeSlider: {
    flex: 1,
  },
  queueOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  queueSheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  queueList: {
    paddingHorizontal: 8,
  },
  queueItem: {
    paddingHorizontal: 4,
  },
});

export default PlayerScreen;