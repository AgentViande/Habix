export interface UserProfile {
  /** Always "default" — single-user app */
  id: string;
  displayName: string;
  totalXP: number;
  currentLevel: number;
  selectedTitle: string;
  availableFreezeDays?: number;
  createdAt: Date;
}
