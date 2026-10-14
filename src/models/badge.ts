/** Persisted record of a badge that has been unlocked */
export interface UnlockedBadge {
  id: string;
  /** Key matching a BadgeDefinition id in constants/badges.ts */
  badgeId: string;
  unlockedAt: Date;
}

/** Static badge definition (not stored in DB) */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** e.g. "streaks" | "completion" | "regularity" | "diversity" | "gamification" | "mood" */
  category: string;
  /** Human-readable unlock condition */
  condition: string;
}
