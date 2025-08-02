import type { Config } from 'drizzle-kit';

export interface ResetResult {
  success: boolean;
  tablesDropped: string[];
  error?: string;
}

/**
 * Resets the database by dropping all user tables while preserving system tables
 * and migration history tables
 */
export async function resetDatabase(config: Config): Promise<ResetResult> {
  try {
    console.log(`Resetting ${config.dialect} database...`);
    
    switch (config.dialect) {
      case 'postgresql': {
        const { resetPostgresDatabase } = await import('./postgres');
        return await resetPostgresDatabase(config);
      }
        
      case 'sqlite': {
        const { resetSqliteDatabase } = await import('./sqlite');
        return await resetSqliteDatabase(config);
      }
        
      default:
        throw new Error(`Unsupported dialect: ${config.dialect}. Only PostgreSQL and SQLite are currently supported.`);
    }
  } catch (error) {
    console.error('Database reset failed:', error);
    return {
      success: false,
      tablesDropped: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}