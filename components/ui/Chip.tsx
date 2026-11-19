import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
};

export function Chip({ label, selected, onPress, icon: Icon }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
          borderColor: selected ? colors.accent : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {Icon ? (
        <Icon size={14} color={selected ? colors.accent : colors.textSecondary} />
      ) : null}
      <AppText variant="label" color={selected ? colors.accent : colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
});