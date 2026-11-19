import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';

type IconComponent = LucideIcon | ComponentType<{
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}>;

type IconButtonProps = {
  icon: IconComponent;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  variant?: 'plain' | 'soft' | 'solid';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  onPress,
  size = 22,
  color,
  background,
  variant = 'plain',
  disabled,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const resolvedColor = color ?? colors.text;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'soft' && {
      backgroundColor: background ?? colors.surfaceAlt,
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    variant === 'solid' && {
      backgroundColor: background ?? colors.accent,
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    disabled && styles.disabled,
    style,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}>
      <View>
        <Icon size={size} color={variant === 'solid' ? colors.onAccent : resolvedColor} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});