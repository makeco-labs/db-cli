import type { Config } from 'drizzle-kit';
import type { CheckResult } from './types';

/**
 * Checks database connection based on the dialect
 */
export async function checkConnection(config: Config): Promise<CheckResult> {
  try {
    console.log(`Checking ${config.dialect} database connection...`);
    
    switch (config.dialect) {
      case 'postgresql': {
        const { checkPostgresConnection } = await import('./postgres');
        return await checkPostgresConnection(config);
      }
        
      case 'sqlite': {
        const { checkSqliteConnection } = await import('./sqlite');
        return await checkSqliteConnection(config);
      }
        
      default:
        throw new Error(`Unsupported dialect: ${config.dialect}. Only PostgreSQL and SQLite are currently supported.`);
    }
  } catch (error) {
    console.error('Database connection check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}