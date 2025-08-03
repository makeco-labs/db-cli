import { sql } from 'drizzle-orm';
import type { SingleStoreConnection } from './connection.singlestore';

// System tables that should not be dropped/truncated
const SYSTEM_TABLES = [
  'information_schema',
  'performance_schema',
  'sys',
];

// Migration/history tables to preserve
const PRESERVED_TABLES = [
  '__drizzle_migrations',
  'drizzle_migrations',
  '__drizzle_migrations_journal',
];

/**
 * Gets all user tables from SingleStore database
 */
export async function getTables(connection: SingleStoreConnection): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  const tables = result.rows.map((row: any) => row.TABLE_NAME)
    .filter((table: string) => !PRESERVED_TABLES.includes(table));

  return tables;
}

/**
 * Gets foreign key constraints for a table
 */
export async function getTableConstraints(connection: SingleStoreConnection, tableName: string): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ${tableName}
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);

  return result.rows.map((row: any) => row.CONSTRAINT_NAME);
}