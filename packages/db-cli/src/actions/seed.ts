import type { SeedResult } from '@makeco/db-cli/types';
import {
  isGelConfig,
  isMysqlConfig,
  isPostgresConfig,
  isSingleStoreConfig,
  isSqliteConfig,
  isTursoConfig,
} from '@makeco/db-cli/utils';
import type { Config } from 'drizzle-kit';

// ========================================================================
// COORDINATOR FUNCTION
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
      const { seedPostgresDatabase } = await import(
        '@makeco/db-cli/dialects/postgres'
      );
      return await seedPostgresDatabase(seedPath);
    }

    if (isSqliteConfig(config)) {
      if (isTursoConfig(config)) {
        const { seedTursoDatabase } = await import(
          '@makeco/db-cli/dialects/turso'
        );
        return await seedTursoDatabase(seedPath);
      }
      const { seedSQLiteDatabase } = await import(
        '@makeco/db-cli/dialects/sqlite'
      );
      return await seedSQLiteDatabase(seedPath);
    }

    if (isMysqlConfig(config)) {
      const { seedMysqlDatabase } = await import(
        '@makeco/db-cli/dialects/mysql'
      );
      return await seedMysqlDatabase(seedPath);
    }

    if (isSingleStoreConfig(config)) {
      const { seedSingleStoreDatabase } = await import(
        '@makeco/db-cli/dialects/singlestore'
      );
      return await seedSingleStoreDatabase(seedPath);
    }

    if (isGelConfig(config)) {
      const { seedGelDatabase } = await import('@makeco/db-cli/dialects/gel');
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

// ========================================================================
// CLI EXECUTION FUNCTION
// ========================================================================

/**
 * Executes database seeding
 */
export async function executeSeed(
  config: Config,
  seedPath: string
): Promise<void> {
  console.log(`\n🌱 Seeding database from: ${seedPath}...`);

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
    process.exit(1);
  }
}
