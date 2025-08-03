import { sql } from 'drizzle-orm';
import type { SingleStoreConnection } from './connection.singlestore';
import type { CheckResult } from '@makeco/db-cli/types';

/**
 * Checks SingleStore database connection
 */
export async function checkSingleStoreConnection(connection: SingleStoreConnection): Promise<CheckResult> {
  try {
    // Get SingleStore version
    const version = await connection.db.execute(sql`SELECT VERSION() AS version`);
    const versionString = version[0][0]?.version as string;

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    console.log(`SingleStore connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    console.error(`SingleStore connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}