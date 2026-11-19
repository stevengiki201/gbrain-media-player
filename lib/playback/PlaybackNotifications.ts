import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PlaybackNotificationAction = 'previous' | 'toggle' | 'next';

export type PlaybackNotificationState = {
  title: string;
  subtitle?: string;
  artwork?: string | null;
  isPlaying: boolean;
  canSkip: boolean;
};

const CATEGORY_ID = 'gbrain-playback-controls';
const CHANNEL_ID = 'gbrain-playback';
const NOTIFICATION_ID = 'gbrain-playback-now-playing';
const ACTION_PREVIOUS = 'gbrain-playback-previous';
const ACTION_TOGGLE = 'gbrain-playback-toggle';
const ACTION_NEXT = 'gbrain-playback-next';

let actionHandler: ((action: PlaybackNotificationAction) => void) | null = null;
let responseSubscription: ReturnType<
  typeof Notifications.addNotificationResponseReceivedListener
> | null = null;
let initialized = false;
let lastSignature = '';

function signatureFor(state: PlaybackNotificationState): string {
  return [
    state.title,
    state.subtitle ?? '',
    state.artwork ?? '',
    state.isPlaying ? 'playing' : 'paused',
    state.canSkip ? 'skippable' : 'single',
  ].join('|');
}

export async function initPlaybackNotifications(
  onAction: (action: PlaybackNotificationAction) => void,
): Promise<void> {
  actionHandler = onAction;
  if (initialized || Platform.OS === 'web') return;
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    }),
  });

  responseSubscription?.remove();
  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.source !== CATEGORY_ID) return;
    if (response.actionIdentifier === ACTION_PREVIOUS) actionHandler?.('previous');
    else if (response.actionIdentifier === ACTION_TOGGLE) actionHandler?.('toggle');
    else if (response.actionIdentifier === ACTION_NEXT) actionHandler?.('next');
  });

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Playback controls',
        description: 'Music and video playback controls',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        enableVibrate: false,
      });
    }

    await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: ACTION_PREVIOUS,
        buttonTitle: 'Back',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_TOGGLE,
        buttonTitle: 'Play/Pause',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_NEXT,
        buttonTitle: 'Next',
        options: { opensAppToForeground: false },
      },
    ]);

    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    initialized = false;
  }
}

export async function updatePlaybackNotification(
  state: PlaybackNotificationState,
): Promise<void> {
  if (Platform.OS === 'web' || !initialized) return;

  const signature = signatureFor(state);
  if (signature === lastSignature) return;
  lastSignature = signature;

  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: state.title,
        subtitle: state.subtitle,
        body: state.isPlaying ? 'Now playing' : 'Paused',
        categoryIdentifier: CATEGORY_ID,
        sound: false,
        priority: 'low',
        sticky: true,
        autoDismiss: false,
        color: '#7C3AED',
        data: {
          source: CATEGORY_ID,
          artwork: state.artwork ?? null,
          canSkip: state.canSkip,
        },
      },
      trigger: null,
    });
  } catch {
    lastSignature = '';
  }
}

export async function clearPlaybackNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  lastSignature = '';
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  } catch {
    return;
  }
}

export function disposePlaybackNotifications(): void {
  responseSubscription?.remove();
  responseSubscription = null;
  actionHandler = null;
  initialized = false;
  lastSignature = '';
}
