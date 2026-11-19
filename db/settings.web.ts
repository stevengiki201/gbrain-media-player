import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';
import { commit, getDb } from './web-store';

export async function getSettings(): Promise<Settings> {
  const stored = getDb().settings;
  return {
    themeMode:
      stored.themeMode === 'light' || stored.themeMode === 'system'
        ? stored.themeMode
        : 'dark',
    audioVolume:
      stored.audioVolume != null
        ? Number(stored.audioVolume)
        : DEFAULT_SETTINGS.audioVolume,
    audioMuted: stored.audioMuted === 'true',
    shuffleDefault: stored.shuffleDefault === 'true',
    repeatDefault:
      stored.repeatDefault === 'all' || stored.repeatDefault === 'one'
        ? stored.repeatDefault
        : 'off',
    resumePlayback: stored.resumePlayback !== 'false',
    scanOnLaunch: stored.scanOnLaunch !== 'false',
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = getDb();
  const entries: [string, string][] = [
    ['themeMode', settings.themeMode],
    ['audioVolume', String(settings.audioVolume)],
    ['audioMuted', String(settings.audioMuted)],
    ['shuffleDefault', String(settings.shuffleDefault)],
    ['repeatDefault', settings.repeatDefault],
    ['resumePlayback', String(settings.resumePlayback)],
    ['scanOnLaunch', String(settings.scanOnLaunch)],
  ];
  for (const [key, value] of entries) db.settings[key] = value;
  commit();
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  const db = getDb();
  db.settings[key] = String(value);
  commit();
}