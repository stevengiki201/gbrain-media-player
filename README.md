# Media Player

An Android-first, offline music & video player built with **Expo (SDK 54)**, **expo-router**, **expo-audio**, **expo-video**, **expo-media-library** and **expo-sqlite**. It scans the device for local media, persists a library, favorites, playlists and playback history, and provides a persistent mini-player plus full-screen music and video players.

The app runs in **Expo Go** for library scanning and playback. Notification playback actions, background media playback and Picture-in-Picture use SDK 54 config plugins and require a **development build**.

## Features

- **Device scan** – discovers local audio/video via `expo-media-library` and caches metadata in SQLite.
- **Music playback** – play/pause, seek, next/previous, shuffle and repeat (off/all/one) via a central `PlaybackManager`.
- **Video playback** – custom `expo-video` screen with seek, ±10s skip, speed, volume, mute, loop, fullscreen and Picture-in-Picture tools.
- **Album/video artwork** – cover images discovered beside local audio and lazy video thumbnails generated from the video file.
- **Notification controls** – Back, Play/Pause and Next actions for active playback in a development build.
- **Persistent mini-player** – shown above the tab bar, with a full-screen music player.
- **Playlists** – create, rename, reorder, add/remove songs, delete.
- **Favorites & history** – quick access to liked tracks and recently played items.
- **Home dashboard** – recently added/played, quick access rows.
- **Search** – filter songs and videos.
- **Settings** – light/dark/system theme, volume, scan-on-launch, repeat default, device storage info, rescan.
- **Themes** – full light and dark palettes in `constants/theme.ts`.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 54, expo-router (typed routes) |
| Audio | expo-audio |
| Video | expo-video |
| Media access | expo-media-library |
| Notifications | expo-notifications |
| Database | expo-sqlite |
| File system | expo-file-system (device storage info) |
| State | MobX + MobX State Tree (stores) + mobx-react-lite |
| UI | react-native, react-native-svg, lucide-react-native |

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (Android) for core playback, or use `npx expo run:android` / an EAS development build for notification controls, background playback and Picture-in-Picture. On first launch, grant media and notification permissions, then run **Scan device for media** (or enable *Scan on launch*) to populate the library.

## Web

```bash
npx expo start --web
```

The app runs in a browser (Chrome, Edge, etc.). A browser has no device media library, and `expo-sqlite`'s web build needs cross-origin isolation (`SharedArrayBuffer`) that the Expo dev server does not send, so the web target uses platform-specific fallbacks:

- **Database** – `db/*.web.ts` provide a `localStorage`-backed store with the same API as the SQLite modules; data persists in the browser under `mediaplayer.webdb.v1`.
- **Media discovery** – `lib/media-scanner.web.ts` returns an empty library; scanning local files is Android-only.
- `metro.config.js` adds `wasm` to `assetExts` (used by `expo-sqlite`'s web worker, which the fallback avoids).

Native (Android/iOS) builds are unchanged and keep using SQLite + `expo-media-library`.

## Architecture

```
app/                 expo-router screens
  (tabs)/            Home · Music · Videos · Playlists · Settings
  player.tsx         Full-screen music player
  video/[id].tsx     Full-screen video player
  playlist/[id].tsx  Playlist detail (reorder / rename / add / remove / delete)
components/ui/       Reusable primitives (Screen, AppText, Slider, rows, MiniPlayer, PlayerControls, ...)
context/             Playback + Theme React contexts
lib/
  playback/          PlaybackManager + MusicEngine + VideoEngine
  media-scanner.ts   Device media discovery
  format.ts          Duration / relative time / file size formatting
  types.ts           Shared domain types
db/                  SQLite client and per-entity helpers
store/               MobX State Tree stores + StoreContext
constants/theme.ts   Design tokens + light/dark palettes
```

### Playback

`PlaybackManager` (a plain TypeScript singleton, exposed through React context) owns a `MusicEngine` (expo-audio) and a `VideoEngine` (expo-video). It is reactive through `subscribe`/`getSnapshot` so `useSyncExternalStore`-style hooks re-render UI. It enforces **audio/video mutual exclusivity** — starting one stops the other. Time/status values from expo-audio/expo-video are handled in **seconds**.

### Data flow

Stores hydrate on launch via `StoreContext` (`Promise.all([...load])`). Device scans read through `lib/media-scanner.ts` and persist to SQLite; the UI observes the stores. Playback position/history is written back on pause/stop and on playback events.

## Expo Go compatibility & limitations

Core library scan, playback, playlists, favorites, history, themes and storage info work in **Expo Go on SDK 54**. The following need a development build:

- **Background audio/video** – `expo-audio` background mode and the `expo-video` media playback service are enabled through app config plugins.
- **Notification playback actions** – Back, Play/Pause and Next use `expo-notifications` categories; the Android channel and foreground behavior require native configuration.
- **Picture-in-Picture** – enabled through the `expo-video` config plugin.
- **Full video media-session integration** – lock-screen metadata and native transport controls depend on platform media sessions.

Artwork is discovered from local cover images beside audio files, and video thumbnails are generated lazily with `expo-video`; both use native image URIs on Android/iOS. Web uses browser fallbacks (see [Web](#web)) and starts with an empty library.

## Verification

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npx expo export -p android --clear   # production bundle sanity check
```

## Notes

- `expo-asset` is pinned to `12.0.14` because the SDK-58 version pulled in by `expo-audio`'s peer range breaks module resolution.
- `app.json` enables the `expo-video`, `expo-media-library` and `expo-notifications` config plugins for background playback, granular permissions, Picture-in-Picture and notification actions.