import { flow, types } from 'mobx-state-tree';

import type { RepeatMode, Settings, ThemeMode } from '@/lib/types';
import { getSettings, saveSetting } from '@/db/settings';

export const SettingsStore = types
  .model('SettingsStore', {
    themeMode: types.optional(
      types.enumeration<ThemeMode>(['light', 'dark', 'system']),
      'dark',
    ),
    audioVolume: types.optional(types.number, 1),
    audioMuted: types.optional(types.boolean, false),
    shuffleDefault: types.optional(types.boolean, false),
    repeatDefault: types.optional(
      types.enumeration<RepeatMode>(['off', 'all', 'one']),
      'off',
    ),
    resumePlayback: types.optional(types.boolean, true),
    scanOnLaunch: types.optional(types.boolean, true),
    hydrated: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    hydrate(settings: Settings) {
      self.themeMode = settings.themeMode;
      self.audioVolume = settings.audioVolume;
      self.audioMuted = settings.audioMuted;
      self.shuffleDefault = settings.shuffleDefault;
      self.repeatDefault = settings.repeatDefault;
      self.resumePlayback = settings.resumePlayback;
      self.scanOnLaunch = settings.scanOnLaunch;
      self.hydrated = true;
    },
    setThemeMode(value: ThemeMode) {
      self.themeMode = value;
      void saveSetting('themeMode', value).catch(() => {});
    },
    setAudioVolume(value: number) {
      const clamped = Math.min(1, Math.max(0, value));
      self.audioVolume = clamped;
      void saveSetting('audioVolume', clamped).catch(() => {});
    },
    setAudioMuted(value: boolean) {
      self.audioMuted = value;
      void saveSetting('audioMuted', value).catch(() => {});
    },
    setShuffleDefault(value: boolean) {
      self.shuffleDefault = value;
      void saveSetting('shuffleDefault', value).catch(() => {});
    },
    setRepeatDefault(value: RepeatMode) {
      self.repeatDefault = value;
      void saveSetting('repeatDefault', value).catch(() => {});
    },
    setResumePlayback(value: boolean) {
      self.resumePlayback = value;
      void saveSetting('resumePlayback', value).catch(() => {});
    },
    setScanOnLaunch(value: boolean) {
      self.scanOnLaunch = value;
      void saveSetting('scanOnLaunch', value).catch(() => {});
    },
    load: flow(function* () {
      const settings = (yield getSettings()) as Settings;
      self.themeMode = settings.themeMode;
      self.audioVolume = settings.audioVolume;
      self.audioMuted = settings.audioMuted;
      self.shuffleDefault = settings.shuffleDefault;
      self.repeatDefault = settings.repeatDefault;
      self.resumePlayback = settings.resumePlayback;
      self.scanOnLaunch = settings.scanOnLaunch;
      self.hydrated = true;
    }),
  }));