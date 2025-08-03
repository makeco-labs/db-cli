import { sql } from 'drizzle-orm';
import type { GelConnection } from './connection.gel';

// Migration/history tables to preserve
const PRESERVED_TABLES = [
  '__drizzle_migrations',
  'drizzle_migrations',
  '__drizzle_migrations_journal',
];

/**
 * Gets all user tables from Gel database
 * Note: This is a placeholder implementation - actual schema queries may vary
 */
export async function getTables(connection: GelConnection): Promise<string[]> {
  try {
    // This is a placeholder query - the actual implementation would depend on Gel's system tables
    const result = await connection.db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = current_schema()
      AND table_type = 'BASE TABLE'
    `);

    const tables = result
      .map((row: any) => row.table_name || row.TABLE_NAME)
      .filter((table: string) => !PRESERVED_TABLES.includes(table));

    return tables;
  } catch (error) {
    // Fallback implementation if information_schema is not available
    console.warn('Could not query information_schema, using fallback method');
    // This would need to be implemented based on Gel's specific system catalog
    return [];
  }
}