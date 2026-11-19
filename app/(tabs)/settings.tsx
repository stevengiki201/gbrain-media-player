import Constants from 'expo-constants';
import { Paths } from 'expo-file-system';
import {
  Clock,
  Database,
  HardDrive,
  Info,
  Moon,
  RefreshCw,
  Sun,
  SunMoon,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Slider } from '@/components/ui/Slider';
import { usePlaybackManager } from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import { formatFileSize } from '@/lib/format';
import type { RepeatMode, ThemeMode } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

function getStorageInfo(): { free: number; total: number } | null {
  try {
    const free = Paths.availableDiskSpace;
    const total = Paths.totalDiskSpace;
    if (!Number.isFinite(free) || !Number.isFinite(total) || total <= 0) return null;
    return { free, total };
  } catch {
    return null;
  }
}

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: typeof Moon }[] = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: SunMoon },
];

const REPEAT_OPTIONS: { key: RepeatMode; label: string }[] = [
  { key: 'off', label: 'Off' },
  { key: 'all', label: 'All' },
  { key: 'one', label: 'One' },
];

const SettingsScreen = observer(() => {
  const store = useStore();
  const manager = usePlaybackManager();
  const { colors, setMode } = useTheme();
  const [volume, setVolume] = useState(store.settings.audioVolume);
  const storage = getStorageInfo();

  useEffect(() => {
    setVolume(store.settings.audioVolume);
    manager.setVolume(store.settings.audioVolume);
    if (store.settings.audioMuted && !manager.getSnapshot().muted) {
      manager.toggleMute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onVolumeChange = (value: number) => {
    setVolume(value);
    manager.setVolume(value);
  };

  const onVolumeComplete = (value: number) => {
    store.settings.setAudioVolume(value);
  };

  const toggleMute = () => {
    const next = !store.settings.audioMuted;
    store.settings.setAudioMuted(next);
    if (next !== manager.getSnapshot().muted) {
      manager.toggleMute();
    }
  };

  const clearHistory = () => {
    Alert.alert('Clear history', 'Remove all recently played history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void store.history.clear() },
    ]);
  };

  const clearPositions = () => {
    Alert.alert('Clear progress', 'Reset all saved playback positions?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void store.history.clearPositions() },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="caption" color={colors.textSecondary}>
          Preferences
        </AppText>
        <AppText variant="display">Settings</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Appearance">
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((option) => {
              const selected = store.settings.themeMode === option.key;
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setMode(option.key)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
                      borderColor: selected ? colors.accent : 'transparent',
                    },
                  ]}>
                  <Icon size={22} color={selected ? colors.accent : colors.textSecondary} />
                  <AppText variant="caption" color={selected ? colors.accent : colors.textSecondary}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Audio">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                {store.settings.audioMuted ? (
                  <VolumeX size={18} color={colors.textSecondary} />
                ) : (
                  <Volume2 size={18} color={colors.textSecondary} />
                )}
                <AppText variant="label">Volume</AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary}>
                {Math.round(volume * 100)}%
              </AppText>
            </View>
            <Slider
              value={volume}
              onValueChange={onVolumeChange}
              onSlidingComplete={onVolumeComplete}
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <VolumeX size={18} color={colors.textSecondary} />
                <AppText variant="label">Mute audio</AppText>
              </View>
              <Switch
                value={store.settings.audioMuted}
                onValueChange={toggleMute}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.onAccent}
              />
            </View>
          </View>
        </Section>

        <Section title="Playback">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <RefreshCw size={18} color={colors.textSecondary} />
                <AppText variant="label">Shuffle by default</AppText>
              </View>
              <Switch
                value={store.settings.shuffleDefault}
                onValueChange={store.settings.setShuffleDefault}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.onAccent}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <RefreshCw size={18} color={colors.textSecondary} />
                <AppText variant="label">Repeat by default</AppText>
              </View>
              <View style={styles.segmented}>
                {REPEAT_OPTIONS.map((option) => {
                  const selected = store.settings.repeatDefault === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => store.settings.setRepeatDefault(option.key)}
                      style={[
                        styles.segment,
                        { backgroundColor: selected ? colors.accent : 'transparent' },
                      ]}>
                      <AppText
                        variant="caption"
                        color={selected ? colors.onAccent : colors.textSecondary}>
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <Clock size={18} color={colors.textSecondary} />
                <AppText variant="label">Resume video playback</AppText>
              </View>
              <Switch
                value={store.settings.resumePlayback}
                onValueChange={store.settings.setResumePlayback}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.onAccent}
              />
            </View>
          </View>
        </Section>

        <Section title="Library">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <Database size={18} color={colors.textSecondary} />
                <View>
                  <AppText variant="label">Songs</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {store.media.trackCount} tracks · {store.media.artists.length} artists
                  </AppText>
                </View>
              </View>
              <AppText variant="heading">{store.media.trackCount}</AppText>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <Database size={18} color={colors.textSecondary} />
                <View>
                  <AppText variant="label">Videos</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {store.media.videoCount} files
                  </AppText>
                </View>
              </View>
              <AppText variant="heading">{store.media.videoCount}</AppText>
            </View>
          </View>

          <Pressable
            onPress={() => void store.media.scan()}
            style={[styles.actionRow, { backgroundColor: colors.card }]}>
            <RefreshCw size={18} color={colors.accent} />
            <AppText variant="label" color={colors.accent}>
              {store.media.scanning ? 'Scanning…' : 'Scan device for media'}
            </AppText>
          </Pressable>
        </Section>

        <Section title="Storage">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <HardDrive size={18} color={colors.textSecondary} />
                <View>
                  <AppText variant="label">Device storage</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {storage
                      ? `${formatFileSize(storage.free)} free of ${formatFileSize(storage.total)}`
                      : 'Unavailable on this platform'}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <Pressable onPress={clearHistory} style={[styles.actionRow, { backgroundColor: colors.card }]}>
            <Clock size={18} color={colors.danger} />
            <AppText variant="label" color={colors.danger}>
              Clear playback history
            </AppText>
          </Pressable>
          <Pressable onPress={clearPositions} style={[styles.actionRow, { backgroundColor: colors.card }]}>
            <Trash2 size={18} color={colors.danger} />
            <AppText variant="label" color={colors.danger}>
              Reset playback positions
            </AppText>
          </Pressable>
        </Section>

        <Section title="About">
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.rowBetween}>
              <View style={styles.rowLabel}>
                <Info size={18} color={colors.textSecondary} />
                <AppText variant="label">Media Player</AppText>
              </View>
              <AppText variant="caption" color={colors.textSecondary}>
                v{Constants.expoConfig?.version ?? '1.0.0'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.aboutNote}>
              Built with Expo · Runs in Expo Go. Background playback, lock-screen controls and
              Android media services require a development build.
            </AppText>
          </View>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  card: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(127,127,127,0.12)',
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  aboutNote: {
    marginTop: 10,
    lineHeight: 18,
  },
});

export default SettingsScreen;