import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { observer } from 'mobx-react-lite';

import { getThemeColors, type ThemeColors } from '@/constants/theme';
import type { ThemeMode } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

export type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ThemeProviderInner = observer(({ children }: { children: ReactNode }) => {
  const store = useStore();
  const systemScheme = useColorScheme();
  const mode = store.settings.themeMode;
  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = useMemo(() => getThemeColors(resolvedMode), [resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors,
      setMode: (next: ThemeMode) => store.settings.setThemeMode(next),
    }),
    [mode, resolvedMode, colors, store],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProviderInner>{children}</ThemeProviderInner>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}