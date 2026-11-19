import { useMemo, useRef } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type SliderProps = {
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function Slider({
  value,
  onValueChange,
  onSlidingComplete,
  minimumTrackTintColor,
  maximumTrackTintColor,
  thumbColor,
  disabled,
  style,
}: SliderProps) {
  const { colors } = useTheme();
  const widthRef = useRef(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          const width = widthRef.current || 1;
          onValueChange?.(clamp01(event.nativeEvent.locationX / width));
        },
        onPanResponderMove: (event) => {
          const width = widthRef.current || 1;
          onValueChange?.(clamp01(event.nativeEvent.locationX / width));
        },
        onPanResponderRelease: (event) => {
          const width = widthRef.current || 1;
          onSlidingComplete?.(clamp01(event.nativeEvent.locationX / width));
        },
        onPanResponderTerminate: () => {},
      }),
    [disabled, onValueChange, onSlidingComplete],
  );

  const progress = clamp01(value);
  const thumbSize = 14;

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
      }}
      {...responder.panHandlers}>
      <View
        style={[
          styles.track,
          { backgroundColor: maximumTrackTintColor ?? colors.border },
        ]}>
        <View
          style={[
            styles.active,
            {
              width: `${progress * 100}%`,
              backgroundColor: minimumTrackTintColor ?? colors.accent,
            },
          ]}
        />
      </View>
      <View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: thumbColor ?? colors.accent,
            left: `${progress * 100}%`,
            marginLeft: -thumbSize / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  active: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
  },
});