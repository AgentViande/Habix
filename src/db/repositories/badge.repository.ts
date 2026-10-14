import { db } from '../index';
import type { UnlockedBadge } from '../../models/badge';

export class BadgeRepository {
  async getAll(): Promise<UnlockedBadge[]> {
    return db.unlockedBadges.toArray();
  }

  async getByBadgeId(badgeId: string): Promise<UnlockedBadge | undefined> {
    const badge = await db.unlockedBadges.where('badgeId').equals(badgeId).first();
    if (!badge && badgeId === 'comp_1') {
      return db.unlockedBadges.where('badgeId').equals('first_step').first();
    }
    return badge;
  }

  async isUnlocked(badgeId: string): Promise<boolean> {
    const badge = await this.getByBadgeId(badgeId);
    return !!badge;
  }

  async unlock(badgeId: string): Promise<UnlockedBadge> {
    const existing = await this.getByBadgeId(badgeId);
    if (existing) return existing;

    const newBadge: UnlockedBadge = {
      id: `badge-${badgeId}-${Date.now()}`,
      badgeId,
      unlockedAt: new Date(),
    };
    await db.unlockedBadges.add(newBadge);
    return newBadge;
  }

  async delete(id: string): Promise<void> {
    await db.unlockedBadges.delete(id);
  }

  async resetAll(): Promise<void> {
    await db.unlockedBadges.clear();
  }
}

export const badgeRepository = new BadgeRepository();
