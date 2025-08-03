import { sql } from 'drizzle-orm';

import type { SQLiteConnection } from './types.sqlite';

// ========================================================================
// SQLITE URL NORMALIZATION
// ========================================================================

/**
 * Normalizes SQLite URL for different drivers
 */
export const normalizeSQLiteUrl = (
  url: string,
  type: 'libsql' | 'better-sqlite'
): string => {
  if (type === 'libsql') {
    if (url.startsWith('file:')) {
      return url;
    }
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === null) {
        return `file:${url}`;
      }
      return url;
    } catch {
      return `file:${url}`;
    }
  }

  if (type === 'better-sqlite') {
    if (url.startsWith('file:')) {
      return url.substring(5);
    }
    return url;
  }

  throw new Error(`Unknown SQLite driver type: ${type}`);
};

// ========================================================================
// SQLITE TABLE UTILITIES
// ========================================================================

// Tables to preserve during operations
export const tableAllowlist = [
  'sqlite_sequence',
  'sqlite_master',
  'migrations',
  'drizzle_migrations',
  'drizzle_query_log',
  'drizzle_query_log_entries',
];

/**
 * Gets all user tables in the database
 */
export async function getTables(
  connection: SQLiteConnection
): Promise<string[]> {
  const statement = sql`SELECT name FROM sqlite_master WHERE type='table'`;
  const result = connection.db.all(statement); // Using db.all() to fetch all tables

  // Handle different result formats from different drivers
  const tables = Array.isArray(result) ? result : [result];

  return (tables as Array<{ name: string }>)
    .map((row) => row.name) // Extract table names
    .filter((table) => !tableAllowlist.includes(table));
}
