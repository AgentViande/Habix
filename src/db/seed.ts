import { db } from './index';
import type { Category } from '../models/category';
import type { UserProfile } from '../models/user-profile';
import type { Settings } from '../models/settings';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-health', name: 'Santé', icon: '💪', color: '#34D399', sortOrder: 0 },
  { id: 'cat-mental', name: 'Mental', icon: '🧠', color: '#A78BFA', sortOrder: 1 },
  { id: 'cat-productivity', name: 'Productivité', icon: '📈', color: '#60A5FA', sortOrder: 2 },
  { id: 'cat-social', name: 'Social', icon: '👥', color: '#FB923C', sortOrder: 3 },
  { id: 'cat-creativity', name: 'Créativité', icon: '🎨', color: '#F472B6', sortOrder: 4 },
  { id: 'cat-finance', name: 'Finance', icon: '💰', color: '#FBBF24', sortOrder: 5 },
];

const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  displayName: 'Utilisateur',
  totalXP: 0,
  currentLevel: 1,
  selectedTitle: 'Débutant motivé',
  createdAt: new Date(),
};

const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  theme: 'system',
  retroactiveDays: 7,
  weekStartDay: 'monday',
  reviewDay: 'monday',
  eveningReminderTime: '21:00',
  showMoodPopup: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  customMoodTags: [],
  userName: '',
  soundEnabled: true,
  soundVolume: 0.2,
  animationsEnabled: true,
  showDailyQuote: true,
};

/**
 * Seeds the database with default data on first launch.
 * Safe to call multiple times — uses put() so it's idempotent.
 */
export async function seedDefaultData(): Promise<void> {
  const existingProfile = await db.userProfile.get('default');
  if (existingProfile) return; // Already seeded

  const yesterdayStr = new Intl.DateTimeFormat('fr-CA').format(new Date(Date.now() - 86400000));

  const sampleHabits = [
    {
      id: 'habit-meditation',
      name: 'Méditation pleine conscience',
      description: '10 minutes de calme et respiration',
      icon: '🧘',
      color: '#A78BFA',
      categoryId: 'cat-mental',
      frequencyType: 'daily' as const,
      frequencyConfig: { type: 'daily' as const },
      targetType: 'boolean' as const,
      targetValue: null,
      targetUnit: null,
      difficulty: 'medium' as const,
      reminderTime: '08:00',
      restDays: [0], // Dimanche repos
      isArchived: false,
      createdAt: new Date(Date.now() - 5 * 86400000),
      sortOrder: 0,
    },
    {
      id: 'habit-water',
      name: 'Hydratation quotidienne',
      description: 'Boire au moins 2000 ml d’eau',
      icon: '💧',
      color: '#60A5FA',
      categoryId: 'cat-health',
      frequencyType: 'daily' as const,
      frequencyConfig: { type: 'daily' as const },
      targetType: 'numeric' as const,
      targetValue: 2000,
      targetUnit: 'ml',
      difficulty: 'easy' as const,
      reminderTime: '10:00',
      restDays: [],
      isArchived: false,
      createdAt: new Date(Date.now() - 5 * 86400000),
      sortOrder: 1,
    },
    {
      id: 'habit-reading',
      name: 'Lecture inspirante',
      description: 'Lire 20 pages d’un livre',
      icon: '📖',
      color: '#34D399',
      categoryId: 'cat-creativity',
      frequencyType: 'weekly_fixed' as const,
      frequencyConfig: { type: 'weekly_fixed' as const, days: [1, 2, 3, 4, 5] },
      targetType: 'numeric' as const,
      targetValue: 20,
      targetUnit: 'pages',
      difficulty: 'medium' as const,
      reminderTime: '21:30',
      restDays: [],
      isArchived: false,
      createdAt: new Date(Date.now() - 5 * 86400000),
      sortOrder: 2,
    },
  ];

  const sampleCompletions = [
    {
      id: `comp-habit-meditation-${yesterdayStr}`,
      habitId: 'habit-meditation',
      date: yesterdayStr,
      value: 1,
      isRetroactive: false,
      completedAt: new Date(Date.now() - 86400000),
    },
    {
      id: `comp-habit-water-${yesterdayStr}`,
      habitId: 'habit-water',
      date: yesterdayStr,
      value: 2000,
      isRetroactive: false,
      completedAt: new Date(Date.now() - 86400000),
    },
  ];

  await db.transaction(
    'rw',
    [db.categories, db.userProfile, db.settings, db.habits, db.completions],
    async () => {
      await db.categories.bulkPut(DEFAULT_CATEGORIES);
      await db.userProfile.put(DEFAULT_PROFILE);
      await db.settings.put(DEFAULT_SETTINGS);
      await db.habits.bulkPut(sampleHabits);
      await db.completions.bulkPut(sampleCompletions);
    }
  );
}
