import type { Config } from 'drizzle-kit';
import {
  isGelConfig,
  isMysqlConfig,
  isPostgresConfig,
  isSingleStoreConfig,
  isSqliteConfig,
  isTursoConfig,
} from '@/dialects';
import type { SeedResult } from '@/dialects/result.types';

// ========================================================================
// SEED ACTION
// ========================================================================

/**
 * Seeds the database by running the seed file
 */
export async function seedDatabase(
  config: Config,
  seedPath: string
): Promise<SeedResult> {
  const timestamp = new Date().toISOString();

  try {
    if (isPostgresConfig(config)) {
      const { seedPostgresDatabase } = await import('@/dialects/postgres');
      return await seedPostgresDatabase(seedPath);
    }

    if (isSqliteConfig(config)) {
      if (isTursoConfig(config)) {
        const { seedTursoDatabase } = await import('@/dialects/turso');
        return await seedTursoDatabase(seedPath);
      }
      const { seedSQLiteDatabase } = await import('@/dialects/sqlite');
      return await seedSQLiteDatabase(seedPath);
    }

    if (isMysqlConfig(config)) {
      const { seedMysqlDatabase } = await import('@/dialects/mysql');
      return await seedMysqlDatabase(seedPath);
    }

    if (isSingleStoreConfig(config)) {
      const { seedSingleStoreDatabase } = await import(
        '@/dialects/singlestore'
      );
      return await seedSingleStoreDatabase(seedPath);
    }

    if (isGelConfig(config)) {
      const { seedGelDatabase } = await import('@/dialects/gel');
      return await seedGelDatabase(seedPath);
    }

    return {
      success: false,
      error: `Unsupported database dialect: ${config.dialect}`,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error during seed',
      timestamp,
    };
  }
}

/**
 * Executes database seeding with CLI output
 */
export async function executeSeedDatabase(
  config: Config,
  seedPath: string
): Promise<void> {
  console.log(`\nSeeding database from: ${seedPath}...`);

  try {
    const result = await seedDatabase(config, seedPath);

    if (result.success) {
      console.log('✅ Database seeded successfully!');
      if (result.message) {
        console.log(result.message);
      }
    } else {
      throw new Error(result.error || 'Database seeding failed');
    }
  } catch (error) {
    console.error(
      '❌ Database seeding failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
