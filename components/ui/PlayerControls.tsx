import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import type { RepeatMode } from '@/lib/types';

import { IconButton } from './IconButton';

type PlayerControlsProps = {
  isPlaying: boolean;
  isShuffle: boolean;
  repeat: RepeatMode;
  showQueueControls?: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
};

export function PlayerControls({
  isPlaying,
  isShuffle,
  repeat,
  showQueueControls = true,
  onToggle,
  onNext,
  onPrevious,
  onShuffle,
  onRepeat,
}: PlayerControlsProps) {
  const { colors } = useTheme();
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <View style={styles.row}>
      {showQueueControls ? (
        <IconButton
          icon={Shuffle}
          onPress={onShuffle}
          size={22}
          color={isShuffle ? colors.accent : colors.textSecondary}
        />
      ) : (
        <View style={styles.spacer} />
      )}

      <IconButton
        icon={SkipBack}
        onPress={onPrevious}
        size={30}
        color={colors.text}
      />

      <View style={[styles.playButton, { backgroundColor: colors.accent }]}>
        <IconButton
          icon={isPlaying ? Pause : Play}
          onPress={onToggle}
          size={34}
          color={colors.onAccent}
        />
      </View>

      <IconButton
        icon={SkipForward}
        onPress={onNext}
        size={30}
        color={colors.text}
      />

      {showQueueControls ? (
        <IconButton
          icon={RepeatIcon}
          onPress={onRepeat}
          size={22}
          color={repeat === 'off' ? colors.textSecondary : colors.accent}
        />
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
  },
});