import {
  ChevronLeft,
  Clapperboard,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  isPictureInPictureSupported,
  VideoView,
  type VideoPlayer,
} from 'expo-video';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Slider } from '@/components/ui/Slider';
import {
  usePlaybackManager,
  usePlaybackSnapshot,
} from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import { formatDuration } from '@/lib/format';
import { useStore } from '@/store/StoreContext';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoId = Array.isArray(id) ? id[0] : id ?? '';
  const store = useStore();
  const manager = usePlaybackManager();
  const snapshot = usePlaybackSnapshot();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const videoViewRef = useRef<VideoView>(null);
  const [player, setPlayer] = useState<VideoPlayer | null>(null);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const pipSupported = isPictureInPictureSupported();

  const item = store.media.videoById(videoId);

  useEffect(() => {
    if (!item) return;
    const savedMs = store.history.positionOf(item.id);
    const canResume =
      store.settings.resumePlayback &&
      savedMs > 5000 &&
      (item.duration <= 0 || savedMs < (item.duration - 5) * 1000);
    const startAt = canResume ? savedMs / 1000 : 0;

    const videoPlayer = manager.prepareVideo(item, startAt);
    setPlayer(videoPlayer);

    return () => {
      manager.stopVideo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!player || !item) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={styles.center}>
          {item ? null : (
            <EmptyState
              icon={Clapperboard}
              title="Video not found"
              subtitle="It may have been removed from your device."
            />
          )}
        </View>
      </View>
    );
  }

  const duration = snapshot.duration || item.duration || 0;
  const progress = seekValue ?? (duration > 0 ? snapshot.position / duration : 0);

  const cycleSpeed = () => {
    const currentIndex = SPEEDS.indexOf(snapshot.rate);
    manager.setRate(SPEEDS[(currentIndex + 1 + SPEEDS.length) % SPEEDS.length] ?? 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <VideoView
        ref={videoViewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture
        fullscreenOptions={{ enable: true, orientation: 'landscape' }}
      />

      <View
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
          <ChevronLeft size={26} color="#FFFFFF" />
        </Pressable>
        <View style={[styles.titleWrap, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
          <AppText variant="caption" color="#E5E7EB" numberOfLines={1}>
            {item.title}
          </AppText>
        </View>
      </View>

      <View style={styles.center} pointerEvents="box-none">
        <IconButton
          icon={snapshot.isPlaying ? Pause : Play}
          onPress={() => manager.toggle()}
          variant="solid"
          background="rgba(124,58,237,0.9)"
          size={30}
          style={styles.centerPlay}
        />
      </View>

      <View
        style={[styles.controls, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.timeRow}>
          <AppText variant="caption" color="#E5E7EB">
            {formatDuration(seekValue != null ? seekValue * duration : snapshot.position)}
          </AppText>
          <AppText variant="caption" color="#E5E7EB">
            {formatDuration(duration)}
          </AppText>
        </View>

        <Slider
          value={progress}
          onValueChange={(value) => setSeekValue(value)}
          onSlidingComplete={(value) => {
            setSeekValue(null);
            manager.seek(value * duration);
          }}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor="rgba(255,255,255,0.35)"
          thumbColor="#FFFFFF"
        />

        <View style={styles.buttonRow}>
          <IconButton
            icon={RotateCcw}
            onPress={() => manager.seekBy(-10)}
            color="#FFFFFF"
            size={22}
          />
          <IconButton
            icon={snapshot.isPlaying ? Pause : Play}
            onPress={() => manager.toggle()}
            color="#FFFFFF"
            size={28}
          />
          <IconButton
            icon={RotateCw}
            onPress={() => manager.seekBy(10)}
            color="#FFFFFF"
            size={22}
          />
          <IconButton
            icon={snapshot.muted || snapshot.volume === 0 ? VolumeX : Volume2}
            onPress={() => manager.toggleMute()}
            color="#FFFFFF"
            size={22}
          />
          <IconButton
            icon={Repeat}
            onPress={() => manager.toggleLoop()}
            color={snapshot.loop ? colors.accent : '#FFFFFF'}
            size={22}
          />
          <Pressable onPress={cycleSpeed} style={styles.speedButton} hitSlop={8}>
            <AppText variant="caption" color="#FFFFFF">
              {snapshot.rate}x
            </AppText>
          </Pressable>
          <IconButton
            icon={PictureInPicture2}
            onPress={() => void videoViewRef.current?.startPictureInPicture()}
            disabled={!pipSupported}
            color="#FFFFFF"
            size={22}
          />
          <IconButton
            icon={Maximize}
            onPress={() => void videoViewRef.current?.enterFullscreen()}
            color="#FFFFFF"
            size={22}
          />
        </View>

        <View style={styles.volumeRow}>
          <AppText variant="caption" color="#D1D5DB">
            Volume
          </AppText>
          <View style={styles.volumeSlider}>
            <Slider
              value={snapshot.muted ? 0 : snapshot.volume}
              onValueChange={(value) => manager.setVolume(value)}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlay: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    marginTop: 4,
  },
  speedButton: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  volumeSlider: {
    flex: 1,
  },
});
