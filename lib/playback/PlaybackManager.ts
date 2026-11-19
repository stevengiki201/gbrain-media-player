import { setAudioModeAsync, type AudioMetadata } from 'expo-audio';
import type { VideoPlayer } from 'expo-video';

import type { MediaItem, RepeatMode } from '@/lib/types';
import { MusicEngine } from './MusicEngine';
import {
  clearPlaybackNotification,
  disposePlaybackNotifications,
  initPlaybackNotifications,
  updatePlaybackNotification,
} from './PlaybackNotifications';
import { VideoEngine } from './VideoEngine';

export type PlaybackSnapshot = {
  activeType: 'audio' | 'video' | null;
  current: MediaItem | null;
  queue: MediaItem[];
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  rate: number;
  loop: boolean;
};

export type PlaybackCallbacks = {
  onStart?: (item: MediaItem) => void;
  onProgress?: (item: MediaItem, positionSeconds: number) => void;
};

export type PlaybackControls = {
  activeType: 'audio' | 'video' | null;
  currentId: string | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
};

const EMPTY_CONTROLS: PlaybackControls = {
  activeType: null,
  currentId: null,
  isPlaying: false,
  shuffle: false,
  repeat: 'off',
};

const EMPTY_SNAPSHOT: PlaybackSnapshot = {
  activeType: null,
  current: null,
  queue: [],
  index: -1,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',
  volume: 1,
  muted: false,
  rate: 1,
  loop: false,
};

const PROGRESS_SAVE_INTERVAL = 5;

function randomIndexExcept(length: number, current: number): number {
  if (length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

export class PlaybackManager {
  private music = new MusicEngine();
  private video = new VideoEngine();

  private activeType: 'audio' | 'video' | null = null;
  private audioQueue: MediaItem[] = [];
  private audioIndex = -1;
  private videoItem: MediaItem | null = null;

  private isPlaying = false;
  private isLoading = false;
  private position = 0;
  private duration = 0;

  private shuffle = false;
  private repeat: RepeatMode = 'off';
  private volume = 1;
  private muted = false;
  private playbackRate = 1;
  private videoLoop = false;

  private lastProgressSave = 0;

  private snapshot: PlaybackSnapshot = { ...EMPTY_SNAPSHOT };
  private listeners = new Set<() => void>();
  private controls: PlaybackControls = { ...EMPTY_CONTROLS };
  private controlsKey = '';
  private controlListeners = new Set<() => void>();
  private callbacks: PlaybackCallbacks = {};

  private initialized = false;

  setCallbacks(callbacks: PlaybackCallbacks): void {
    this.callbacks = callbacks;
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.music.onStatus = (status) => {
      if (this.activeType !== 'audio') return;
      this.isLoading = status.buffering && !status.loaded;
      this.isPlaying = status.playing;
      this.position = status.position;
      this.duration = status.duration;
      this.emit();
      this.maybeSaveProgress();
    };
    this.music.onEnded = () => {
      if (this.activeType === 'audio') this.handleAudioEnded();
    };

    this.video.onStatus = (status) => {
      if (this.activeType !== 'video') return;
      this.isLoading = status.status === 'loading';
      this.isPlaying = status.playing;
      this.position = status.position;
      this.duration = status.duration;
      this.emit();
      this.maybeSaveProgress();
    };
    this.video.onEnded = () => {
      if (this.activeType !== 'video') return;
      if (this.repeat === 'all' || this.repeat === 'one') {
        this.video.seek(0);
        this.video.play();
      } else {
        this.isPlaying = false;
        this.emit();
      }
    };

    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});

    void initPlaybackNotifications((action) => {
      if (action === 'toggle') this.toggle();
      else if (action === 'next') this.next();
      else if (action === 'previous') this.previous();
    }).catch(() => {});
  }

  getSnapshot = (): PlaybackSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getControls = (): PlaybackControls => this.controls;

  subscribeControls = (listener: () => void): (() => void) => {
    this.controlListeners.add(listener);
    return () => {
      this.controlListeners.delete(listener);
    };
  };

  private emit(): void {
    const isVideo = this.activeType === 'video';
    const current = isVideo
      ? this.videoItem
      : this.audioQueue[this.audioIndex] ?? null;
    this.snapshot = {
      activeType: this.activeType,
      current,
      queue: isVideo ? [] : this.audioQueue,
      index: isVideo ? -1 : this.audioIndex,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      position: this.position,
      duration: this.duration,
      shuffle: this.shuffle,
      repeat: this.repeat,
      volume: this.volume,
      muted: this.muted,
      rate: this.playbackRate,
      loop: this.videoLoop,
    };
    for (const listener of this.listeners) listener();

    const controlsKey = `${this.snapshot.activeType}|${current?.id ?? ''}|${this.isPlaying}|${this.shuffle}|${this.repeat}`;
    if (controlsKey !== this.controlsKey) {
      this.controlsKey = controlsKey;
      this.controls = {
        activeType: this.snapshot.activeType,
        currentId: current?.id ?? null,
        isPlaying: this.isPlaying,
        shuffle: this.shuffle,
        repeat: this.repeat,
      };
      for (const listener of this.controlListeners) listener();
    }

    this.syncNotification(current);
  }

  private syncNotification(current: MediaItem | null): void {
    if (!current) {
      void clearPlaybackNotification();
      return;
    }

    const subtitle = [current.artist, current.album].filter(Boolean).join(' • ');
    void updatePlaybackNotification({
      title: current.title,
      subtitle: subtitle || undefined,
      artwork: current.artwork ?? current.thumbnail,
      isPlaying: this.isPlaying,
      canSkip: this.activeType === 'audio' && this.audioQueue.length > 1,
    });
  }

  private maybeSaveProgress(): void {
    const item = this.snapshot.current;
    if (!item) return;
    const now = Date.now();
    if (now - this.lastProgressSave < PROGRESS_SAVE_INTERVAL * 1000) return;
    this.lastProgressSave = now;
    this.callbacks.onProgress?.(item, this.position);
  }

  private metadataFor(item: MediaItem): AudioMetadata {
    return {
      title: item.title,
      artist: item.artist || undefined,
      albumTitle: item.album || undefined,
      artworkUrl: item.artwork ?? undefined,
    };
  }

  playAudio(item: MediaItem, queue?: MediaItem[]): void {
    const list = queue && queue.length > 0 ? queue : [item];
    let index = list.findIndex((entry) => entry.id === item.id);
    if (index < 0) {
      index = 0;
    }

    this.video.pause();
    this.videoItem = null;
    this.activeType = 'audio';
    this.audioQueue = list;
    this.audioIndex = index;
    this.position = 0;
    this.duration = item.duration || 0;
    this.isLoading = true;
    this.isPlaying = true;

    this.music.setVolume(this.volume);
    this.music.setMuted(this.muted);
    this.music.load(item.uri, true, this.metadataFor(item));
    this.callbacks.onStart?.(item);
    this.emit();
  }

  playVideo(item: MediaItem, startAt = 0): void {
    this.music.pause();
    this.music.clearLockScreen();
    this.audioQueue = [];
    this.audioIndex = -1;
    this.videoItem = item;
    this.activeType = 'video';
    this.position = startAt;
    this.duration = item.duration || 0;
    this.isLoading = true;
    this.isPlaying = true;

    this.video.setVolume(this.volume);
    this.video.setMuted(this.muted);
    this.video.load(item.uri, true, startAt, {
      title: item.title,
      artist: item.artist || item.album || undefined,
      artwork: item.artwork ?? item.thumbnail ?? undefined,
    });
    this.callbacks.onStart?.(item);
    this.emit();
  }

  prepareVideo(item: MediaItem, startAt = 0): VideoPlayer {
    this.playVideo(item, startAt);
    return this.video.getPlayer();
  }

  stopVideo(): void {
    this.video.pause();
    if (this.activeType === 'video') {
      this.activeType = null;
      this.videoItem = null;
      this.isPlaying = false;
      this.isLoading = false;
      this.position = 0;
      this.duration = 0;
      this.emit();
    }
  }

  toggle(): void {
    if (!this.snapshot.current) return;
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    if (this.activeType === 'audio') this.music.play();
    else if (this.activeType === 'video') this.video.play();
    this.isPlaying = true;
    this.emit();
  }

  pause(): void {
    if (this.activeType === 'audio') this.music.pause();
    else if (this.activeType === 'video') this.video.pause();
    this.isPlaying = false;
    const current = this.snapshot.current;
    if (current) this.callbacks.onProgress?.(current, this.position);
    this.emit();
  }

  seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(this.duration || seconds, seconds));
    if (this.activeType === 'audio') this.music.seek(clamped);
    else if (this.activeType === 'video') this.video.seek(clamped);
    this.position = clamped;
    this.emit();
  }

  seekBy(seconds: number): void {
    if (!this.snapshot.current) return;
    this.seek(this.position + seconds);
  }

  setRate(rate: number): void {
    const clamped = Math.min(3, Math.max(0.25, rate));
    this.playbackRate = clamped;
    if (this.activeType === 'audio') this.music.setRate(clamped);
    else if (this.activeType === 'video') this.video.setRate(clamped);
    this.emit();
  }

  toggleLoop(): void {
    if (this.activeType !== 'video') return;
    this.videoLoop = !this.videoLoop;
    this.video.setLoop(this.videoLoop);
    this.emit();
  }

  next(): void {
    if (this.activeType !== 'audio') return;
    if (this.audioQueue.length === 0) return;

    let nextIndex: number;
    if (this.shuffle) {
      nextIndex = randomIndexExcept(this.audioQueue.length, this.audioIndex);
    } else if (this.audioIndex + 1 < this.audioQueue.length) {
      nextIndex = this.audioIndex + 1;
    } else if (this.repeat === 'all') {
      nextIndex = 0;
    } else {
      this.pause();
      return;
    }

    this.audioIndex = nextIndex;
    this.startCurrentAudio();
  }

  previous(): void {
    if (this.activeType !== 'audio') return;
    if (this.audioQueue.length === 0) return;

    if (this.position > 3) {
      this.seek(0);
      return;
    }

    let prevIndex: number;
    if (this.shuffle) {
      prevIndex = randomIndexExcept(this.audioQueue.length, this.audioIndex);
    } else if (this.audioIndex - 1 >= 0) {
      prevIndex = this.audioIndex - 1;
    } else if (this.repeat === 'all') {
      prevIndex = this.audioQueue.length - 1;
    } else {
      prevIndex = 0;
    }

    this.audioIndex = prevIndex;
    this.startCurrentAudio();
  }

  private startCurrentAudio(): void {
    const item = this.audioQueue[this.audioIndex];
    if (!item) return;
    this.position = 0;
    this.duration = item.duration || 0;
    this.isLoading = true;
    this.isPlaying = true;
    this.music.setMuted(this.muted);
    this.music.load(item.uri, true, this.metadataFor(item));
    this.callbacks.onStart?.(item);
    this.emit();
  }

  private handleAudioEnded(): void {
    if (this.repeat === 'one') {
      this.music.seek(0);
      this.music.play();
      return;
    }

    if (this.audioIndex + 1 < this.audioQueue.length) {
      this.audioIndex += 1;
      this.startCurrentAudio();
      return;
    }

    if (this.shuffle && this.audioQueue.length > 1) {
      this.audioIndex = randomIndexExcept(this.audioQueue.length, this.audioIndex);
      this.startCurrentAudio();
      return;
    }

    if (this.repeat === 'all' && this.audioQueue.length > 0) {
      this.audioIndex = 0;
      this.startCurrentAudio();
      return;
    }

    this.isPlaying = false;
    this.emit();
  }

  toggleShuffle(): void {
    this.shuffle = !this.shuffle;
    this.emit();
  }

  cycleRepeat(): void {
    if (this.repeat === 'off') this.repeat = 'all';
    else if (this.repeat === 'all') this.repeat = 'one';
    else this.repeat = 'off';
    this.emit();
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.muted = false;
    this.music.setVolume(this.volume);
    this.music.setMuted(false);
    this.video.setVolume(this.volume);
    this.video.setMuted(false);
    this.emit();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.music.setMuted(this.muted);
    this.video.setMuted(this.muted);
    this.emit();
  }

  stop(): void {
    if (this.snapshot.current) {
      this.callbacks.onProgress?.(this.snapshot.current, this.position);
    }
    this.music.pause();
    this.music.clearLockScreen();
    this.video.pause();
    this.activeType = null;
    this.audioQueue = [];
    this.audioIndex = -1;
    this.videoItem = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.position = 0;
    this.duration = 0;
    this.emit();
  }

  destroy(): void {
    this.music.destroy();
    this.video.destroy();
    void clearPlaybackNotification();
    disposePlaybackNotifications();
    this.listeners.clear();
  }
}