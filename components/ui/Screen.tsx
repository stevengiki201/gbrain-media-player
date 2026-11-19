import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: boolean;
  backgroundColor?: string;
};

export function Screen({ children, style, edges = true, backgroundColor }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: backgroundColor ?? colors.background,
          paddingTop: edges ? insets.top : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}