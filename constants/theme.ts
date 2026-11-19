import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  elevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  success: string;
  warning: string;
  tabBar: string;
  tabBarBorder: string;
  overlay: string;
  scrim: string;
  input: string;
  onImage: string;
};

const ACCENT = '#00D4FF';
const ACCENT_PRESSED = '#00B4E6';

export const lightTheme: ThemeColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F5',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  accent: ACCENT,
  accentPressed: ACCENT_PRESSED,
  accentSoft: 'rgba(0, 180, 230, 0.12)',
  onAccent: '#FFFFFF',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  tabBar: 'rgba(255, 255, 255, 0.92)',
  tabBarBorder: '#E2E8F0',
  overlay: 'rgba(15, 23, 42, 0.45)',
  scrim: 'rgba(0, 0, 0, 0.55)',
  input: '#F1F5F9',
  onImage: '#FFFFFF',
};

export const darkTheme: ThemeColors = {
  background: '#0A0A0C',
  surface: '#121216',
  surfaceAlt: '#1A1A20',
  card: '#16161B',
  elevated: '#1F1F26',
  text: '#F5F7FA',
  textSecondary: '#A7AFBB',
  textMuted: '#6B7280',
  border: '#26262E',
  borderStrong: '#33333D',
  accent: ACCENT,
  accentPressed: ACCENT_PRESSED,
  accentSoft: 'rgba(0, 212, 255, 0.16)',
  onAccent: '#04121A',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  tabBar: 'rgba(12, 12, 16, 0.92)',
  tabBarBorder: '#1F1F26',
  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.8)',
  input: '#1A1A20',
  onImage: '#FFFFFF',
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
    serif: 'Georgia',
  },
  default: {
    sans: 'System',
    rounded: 'System',
    mono: 'monospace',
    serif: 'serif',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    rounded: "'SF Pro Rounded', 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    serif: "Georgia, 'Times New Roman', serif",
  },
});

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  float: {
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const TYPOGRAPHY = {
  display: { fontSize: 30, fontWeight: '800', fontFamily: Fonts.rounded },
  title: { fontSize: 24, fontWeight: '700', fontFamily: Fonts.rounded },
  heading: { fontSize: 18, fontWeight: '700', fontFamily: Fonts.rounded },
  body: { fontSize: 16, fontWeight: '400', fontFamily: Fonts.sans },
  label: { fontSize: 14, fontWeight: '600', fontFamily: Fonts.sans },
  caption: { fontSize: 12, fontWeight: '500', fontFamily: Fonts.sans },
} as const;

export const COLORS = { light: lightTheme, dark: darkTheme };
export const tintColor = ACCENT;