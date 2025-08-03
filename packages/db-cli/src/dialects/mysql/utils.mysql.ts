import { sql } from 'drizzle-orm';
import type { MysqlConnection } from './connection.mysql';

// System tables that should not be dropped/truncated
const SYSTEM_TABLES = [
  'information_schema',
  'mysql',
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
 * Gets all user tables from MySQL database
 */
export async function getTables(
  connection: MysqlConnection
): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  const tables = result[0]
    .map((row: any) => row.TABLE_NAME)
    .filter((table: string) => !PRESERVED_TABLES.includes(table));

  return tables;
}

/**
 * Gets foreign key constraints for a table
 */
export async function getTableConstraints(
  connection: MysqlConnection,
  tableName: string
): Promise<string[]> {
  const result = await connection.db.execute(sql`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ${tableName}
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);

  return result[0].map((row: any) => row.CONSTRAINT_NAME);
}
