import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';
import { initDatabase } from './client';

export async function getSettings(): Promise<Settings> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const stored: Record<string, string> = {};
  for (const row of rows) stored[row.key] = row.value;

  return {
    themeMode:
      stored.themeMode === 'light' || stored.themeMode === 'system'
        ? stored.themeMode
        : 'dark',
    audioVolume:
      stored.audioVolume != null ? Number(stored.audioVolume) : DEFAULT_SETTINGS.audioVolume,
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
  const db = await initDatabase();
  const entries: [string, string][] = [
    ['themeMode', settings.themeMode],
    ['audioVolume', String(settings.audioVolume)],
    ['audioMuted', String(settings.audioMuted)],
    ['shuffleDefault', String(settings.shuffleDefault)],
    ['repeatDefault', settings.repeatDefault],
    ['resumePlayback', String(settings.resumePlayback)],
    ['scanOnLaunch', String(settings.scanOnLaunch)],
  ];
  await db.withTransactionAsync(async () => {
    for (const [key, value] of entries) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      );
    }
  });
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value)],
  );
}