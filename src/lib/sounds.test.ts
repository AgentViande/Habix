import { describe, it, expect } from 'vitest';
import { sounds } from './sounds';

describe('Sound Synthesizer (sounds.ts)', () => {
  it('calls playPop, playUntick, playLevelUp, playAllDone without throwing', () => {
    expect(() => sounds.playPop()).not.toThrow();
    expect(() => sounds.playUntick()).not.toThrow();
    expect(() => sounds.playLevelUp()).not.toThrow();
    expect(() => sounds.playMilestone()).not.toThrow();
    expect(() => sounds.playAllDone()).not.toThrow();
  });

  it('respects volume overrides safely', () => {
    expect(() => sounds.playPop(0)).not.toThrow();
    expect(() => sounds.playPop(0.5)).not.toThrow();
  });
});
