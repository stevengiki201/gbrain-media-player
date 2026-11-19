# Media Player

An Android-first, offline music & video player built with **Expo (SDK 54)**, **expo-router**, **expo-audio**, **expo-video**, **expo-media-library** and **expo-sqlite**. It scans the device for local media, persists a library, favorites, playlists and playback history, and provides a persistent mini-player plus full-screen music and video players.

The app is designed to run **in Expo Go with no custom native modules, no config plugins and no dev build**.

## Features

- **Device scan** – discovers local audio/video via `expo-media-library` and caches metadata in SQLite.
- **Music playback** – play/pause, seek, next/previous, shuffle and repeat (off/all/one) via a central `PlaybackManager`.
- **Video playback** – `expo-video` `VideoView` player with a custom full-screen screen.
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
| Database | expo-sqlite |
| File system | expo-file-system (device storage info) |
| State | MobX + MobX State Tree (stores) + mobx-react-lite |
| UI | react-native, react-native-svg, lucide-react-native |

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (Android). On first launch, grant media permissions, then run **Scan device for media** (or enable *Scan on launch*) to populate the library.

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

This project deliberately avoids config plugins and custom native code so it runs in **Expo Go on SDK 54**. As a result, some capabilities are unavailable there and require a development build:

- **Background audio & lock-screen/notification controls** – not available in Expo Go. On Android, playback pauses when the app is backgrounded; a foreground service (media notification, lock-screen controls) needs a development build and native configuration.
- **Artwork & video thumbnails** – not extracted. Artwork uses gradient + initials placeholders; video rows use generated gradient placeholders.
- **Advanced video controls** – brightness, subtitle/audio-track selection and fine-grained speed controls are delegated to the native `VideoView`; availability varies by platform and may require a dev build.
- **Scoped storage / granular media permissions** – Android 13+ requests granular media permissions; behavior is handled by `expo-media-library` and may differ slightly between Expo Go and a production build.
- **Web** – device scanning and SQLite are replaced by browser fallbacks (see [Web](#web)); the web library starts empty.

Everything else (library scan, playback, playlists, favorites, history, themes, storage info) works in Expo Go.

## Verification

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npx expo export -p android --clear   # production bundle sanity check
```

## Notes

- `expo-asset` is pinned to `12.0.14` because the SDK-58 version pulled in by `expo-audio`'s peer range breaks module resolution.
- Config plugins auto-added by `expo-audio` / `expo-video` / `expo-sqlite` / `expo-asset` were removed from `app.json` to stay Expo Go–only.