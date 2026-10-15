import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { useChallengeStore } from './useChallengeStore';

describe('useChallengeStore - Anti-Exploit / Single Credit Per Day', () => {
  beforeEach(async () => {
    await db.challenges.clear();
    await useChallengeStore.getState().loadChallenges();
  });

  it('starts a challenge and records initial state', async () => {
    const store = useChallengeStore.getState();
    const id = await store.startChallenge('habit-read', 21, '2026-10-15');

    const challenges = useChallengeStore.getState().challenges;
    expect(challenges.length).toBe(1);
    expect(challenges[0].id).toBe(id);
    expect(challenges[0].currentDay).toBe(1);
    expect(challenges[0].status).toBe('active');
  });

  it('only advances currentDay once per day even if completed multiple times', async () => {
    const store = useChallengeStore.getState();
    await store.startChallenge('habit-meditate', 21, '2026-10-15');

    // First completion today (2026-10-15)
    await store.updateChallengeProgress('habit-meditate', '2026-10-15', true, false);
    let challenge = useChallengeStore.getState().challenges[0];
    expect(challenge.currentDay).toBe(2);

    // Second completion on same day (e.g. unticked and reticked on 2026-10-15)
    await store.updateChallengeProgress('habit-meditate', '2026-10-15', true, false);
    challenge = useChallengeStore.getState().challenges[0];
    // Must NOT advance again on the same day!
    expect(challenge.currentDay).toBe(2);

    // Third completion on same day
    await store.updateChallengeProgress('habit-meditate', '2026-10-15', true, false);
    challenge = useChallengeStore.getState().challenges[0];
    expect(challenge.currentDay).toBe(2);

    // Next day (2026-10-16) completion: should advance to 3
    await store.updateChallengeProgress('habit-meditate', '2026-10-16', true, false);
    challenge = useChallengeStore.getState().challenges[0];
    expect(challenge.currentDay).toBe(3);
  });
});
