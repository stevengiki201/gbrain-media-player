import 'react-native-reanimated';

import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PlaybackProvider } from '@/context/PlaybackContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { StoreProvider } from '@/store/StoreContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { resolvedMode, colors } = useTheme();
  const navTheme = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavThemeProvider
      value={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
          notification: colors.accent,
        },
      }}>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{ presentation: 'card', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="playlist/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen
          name="video/[id]"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider>
          <PlaybackProvider>
            <RootNavigator />
          </PlaybackProvider>
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}