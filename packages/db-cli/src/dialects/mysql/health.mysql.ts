import { sql } from 'drizzle-orm';

import type { HealthCheckResult } from '@/dialects/result.types';
import type { MysqlConnection } from './types.mysql';

/**
 * Checks MySQL database connection
 */
export async function checkMysqlConnection(
  connection: MysqlConnection
): Promise<HealthCheckResult> {
  try {
    // Get MySQL version
    const version = await connection.db.execute(
      sql`SELECT VERSION() AS version`
    );
    const versionString = version[0][0]?.version as string;

    // Perform a simple health check query
    await connection.db.execute(sql`SELECT 1`);

    console.log(`MySQL connection successful: ${versionString}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: versionString,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Database connection failed';
    console.error(`MySQL connection failed: ${message}`);

    return {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
