import {
  createVideoPlayer,
  type VideoMetadata,
  type VideoPlayer,
  type VideoPlayerStatus,
} from 'expo-video';
import type { EventSubscription } from 'expo-modules-core';

export type VideoStatus = {
  playing: boolean;
  position: number;
  duration: number;
  status: VideoPlayerStatus;
  rate: number;
  muted: boolean;
  volume: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

export class VideoEngine {
  private player: VideoPlayer | null = null;
  private subscriptions: EventSubscription[] = [];

  public onStatus: ((status: VideoStatus) => void) | null = null;
  public onEnded: (() => void) | null = null;

  private emit(): void {
    const player = this.player;
    if (!player) return;
    this.onStatus?.({
      playing: player.playing,
      position: player.currentTime,
      duration: player.duration,
      status: player.status,
      rate: player.playbackRate,
      muted: player.muted,
      volume: player.volume,
    });
  }

  private ensure(): VideoPlayer {
    if (this.player) return this.player;

    const player = createVideoPlayer(null);
    player.timeUpdateEventInterval = 0.5;

    this.subscriptions.push(player.addListener('playingChange', () => this.emit()));
    this.subscriptions.push(player.addListener('timeUpdate', () => this.emit()));
    this.subscriptions.push(player.addListener('statusChange', () => this.emit()));
    this.subscriptions.push(player.addListener('sourceLoad', () => this.emit()));
    this.subscriptions.push(
      player.addListener('playToEnd', () => {
        this.emit();
        this.onEnded?.();
      }),
    );

    this.player = player;
    return player;
  }

  load(
    uri: string,
    autoplay: boolean,
    startAt = 0,
    metadata?: VideoMetadata,
  ): void {
    const player = this.ensure();
    player.replace(metadata ? { uri, metadata } : uri);
    if (startAt > 0) {
      player.currentTime = startAt;
    }
    if (autoplay) {
      player.play();
    }
  }

  getPlayer(): VideoPlayer {
    return this.ensure();
  }

  play(): void {
    this.ensure().play();
  }

  pause(): void {
    this.player?.pause();
  }

  seek(seconds: number): void {
    if (!this.player) return;
    this.player.currentTime = Math.max(0, seconds);
  }

  setRate(rate: number): void {
    if (this.player) this.player.playbackRate = rate;
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

  get position(): number {
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

  destroy(): void {
    for (const sub of this.subscriptions) sub.remove();
    this.subscriptions = [];
    this.player?.pause();
    this.player = null;
  }
}