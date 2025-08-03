import { sql } from 'drizzle-orm';
import type { PostgresConnection } from './connection.postgres';
import type { CheckResult } from '@makeco/db-cli/types';

/**
 * Checks PostgreSQL database connection
 */
export async function checkPostgresConnection(connection: PostgresConnection): Promise<CheckResult> {
  try {

    // Get PostgreSQL version
    const version = await connection.db.execute(sql`SELECT version() AS version`);
    const versionString = version[0]?.version as string;

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    console.log(`PostgreSQL connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    console.error(`PostgreSQL connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}