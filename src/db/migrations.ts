import type { HabixDB } from './index';

/**
 * Apply schema migrations when upgrading from an older version.
 * Currently at version 1, so this is a placeholder for future migrations.
 */
export function applyMigrations(_db: HabixDB): void {
  // Example for a future version 2:
  // db.version(2).stores({ habits: 'id, categoryId, ..., newField' }).upgrade(tx => {
  //   return tx.table('habits').toCollection().modify(habit => {
  //     habit.newField = 'defaultValue';
  //   });
  // });
}
