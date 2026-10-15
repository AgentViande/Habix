/**
 * sounds.ts — Synthesized sound effects using the Web Audio API.
 * 100% generated with oscillators and gain envelopes (no external audio files).
 */

import { useSettingsStore } from '../stores/useSettingsStore';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMutedDuringStartup = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Resume or init AudioContext on first user interaction
      const unlockAudio = () => {
        this.ensureContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });

      // Disable startup mute after 1.5 seconds
      setTimeout(() => {
        this.isMutedDuringStartup = false;
      }, 1500);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Helper to get effective volume (0.0 to 1.0) and enabled status from settings.
   */
  private getSoundConfig(customVolume?: number): { enabled: boolean; volume: number } {
    if (this.isMutedDuringStartup && customVolume === undefined) {
      return { enabled: false, volume: 0 };
    }

    const { settings } = useSettingsStore.getState();
    const enabled = settings.soundEnabled ?? true;
    const baseVolume = settings.soundVolume ?? 0.2;
    const volume = customVolume !== undefined ? customVolume : baseVolume;

    return {
      enabled: enabled || customVolume !== undefined,
      volume: Math.max(0, Math.min(1, volume)),
    };
  }

  /**
   * Short, soft pop sound when checking an habit (pitch sweeps upward, ~90ms).
   */
  public playPop(customVolume?: number): void {
    const { enabled, volume } = this.getSoundConfig(customVolume);
    if (!enabled || volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch bend: low to high (260 Hz -> 540 Hz)
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

      // Envelope: gentle attack, exponential decay
      const peakGain = 0.22 * volume;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Graceful silence on audio error
    }
  }

  /**
   * Subtle descending tone when unticking an habit (~80ms).
   */
  public playUntick(customVolume?: number): void {
    const { enabled, volume } = this.getSoundConfig(customVolume);
    if (!enabled || volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Pitch falls: 420 Hz -> 200 Hz
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      const peakGain = 0.15 * volume;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Graceful silence
    }
  }

  /**
   * Ascending 4-note melodic jingle for level-ups, badges, and streak milestones (7, 30, 100 days).
   */
  public playLevelUp(customVolume?: number): void {
    const { enabled, volume } = this.getSoundConfig(customVolume);
    if (!enabled || volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const noteDuration = 0.11;
      const baseNow = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const start = baseNow + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const peakGain = 0.18 * volume;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + noteDuration + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + noteDuration + 0.18);
      });
    } catch {
      // Graceful silence
    }
  }

  /** Alias for milestones */
  public playMilestone(customVolume?: number): void {
    this.playLevelUp(customVolume);
  }

  /**
   * Triumphant chime jingle when all habits of the day are done (~750ms).
   */
  public playAllDone(customVolume?: number): void {
    const { enabled, volume } = this.getSoundConfig(customVolume);
    if (!enabled || volume <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // Notes: C5, E5, G5, B5, C6 (Major 7th resolving into high tonic)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      const baseNow = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const start = baseNow + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        const isLast = idx === notes.length - 1;
        const peakGain = (isLast ? 0.22 : 0.16) * volume;
        const duration = isLast ? 0.5 : 0.25;

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.05);
      });
    } catch {
      // Graceful silence
    }
  }
}

export const sounds = new SoundManager();
