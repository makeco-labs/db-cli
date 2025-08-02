import type { Config } from 'drizzle-kit';
import type { SeedResult } from '@makeco/db-cli/types';
import { isPostgresConfig, isSqliteConfig } from '@makeco/db-cli/utils/config';

/**
 * Seeds the database by running the seed file
 */
export async function seedDatabase(config: Config, seedPath: string): Promise<SeedResult> {
  const timestamp = new Date().toISOString();

  try {
    if (isPostgresConfig(config)) {
      const { seedPostgresDatabase } = await import('./postgres');
      return await seedPostgresDatabase(seedPath);
    }

    if (isSqliteConfig(config)) {
      const { seedSQLiteDatabase } = await import('./sqlite');
      return await seedSQLiteDatabase(seedPath);
    }

    return {
      success: false,
      error: `Unsupported database dialect: ${config.dialect}`,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during seed',
      timestamp,
    };
  }
}