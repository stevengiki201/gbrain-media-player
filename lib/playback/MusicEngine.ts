import { createAudioPlayer, type AudioMetadata, type AudioPlayer } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';

export type MusicStatus = {
  playing: boolean;
  position: number;
  duration: number;
  buffering: boolean;
  loaded: boolean;
  ended: boolean;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export class MusicEngine {
  private player: AudioPlayer | null = null;
  private subscription: EventSubscription | null = null;

  public onStatus: ((status: MusicStatus) => void) | null = null;
  public onEnded: (() => void) | null = null;

  private ensure(): AudioPlayer {
    if (this.player) return this.player;

    const player = createAudioPlayer(null, { updateInterval: 400 });
    this.subscription = player.addListener('playbackStatusUpdate', (status) => {
      this.onStatus?.({
        playing: status.playing,
        position: status.currentTime,
        duration: status.duration,
        buffering: status.isBuffering,
        loaded: status.isLoaded,
        ended: status.didJustFinish,
      });
      if (status.didJustFinish) {
        this.onEnded?.();
      }
    });
    this.player = player;
    return player;
  }

  load(uri: string, autoplay: boolean, metadata?: AudioMetadata): void {
    const player = this.ensure();
    player.replace({ uri });
    if (metadata) {
      player.setActiveForLockScreen(true, metadata, {
        showSeekForward: true,
        showSeekBackward: true,
      });
    }
    if (autoplay) {
      player.play();
    }
  }

  play(): void {
    this.ensure().play();
  }

  pause(): void {
    this.player?.pause();
  }

  seek(seconds: number): void {
    if (!this.player) return;
    this.player.seekTo(Math.max(0, seconds));
  }

  setVolume(volume: number): void {
    if (this.player) this.player.volume = clamp01(volume);
  }

  setMuted(muted: boolean): void {
    if (this.player) this.player.muted = muted;
  }

  setLoop(loop: boolean): void {
    if (this.player) this.player.loop = loop;
  }

  setRate(rate: number): void {
    this.player?.setPlaybackRate(rate);
  }

  get currentTime(): number {
    return this.player?.currentTime ?? 0;
  }

  get duration(): number {
    return this.player?.duration ?? 0;
  }

  get playing(): boolean {
    return this.player?.playing ?? false;
  }

  hasPlayer(): boolean {
    return this.player !== null;
  }

  clearLockScreen(): void {
    this.player?.clearLockScreenControls();
  }

  destroy(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.player?.clearLockScreenControls();
    this.player?.remove();
    this.player = null;
  }
}