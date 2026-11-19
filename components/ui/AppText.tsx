import { Text, type TextProps, type TextStyle } from 'react-native';

import { TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Variant = keyof typeof TYPOGRAPHY;

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function AppText({ variant = 'body', color, align, style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        TYPOGRAPHY[variant],
        { color: color ?? colors.text },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}