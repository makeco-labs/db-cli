import type { GelConnection } from '@/dialects/gel';
import type { MysqlConnection } from '@/dialects/mysql';
import type { PostgresConnection } from '@/dialects/postgres';
import type { SingleStoreConnection } from '@/dialects/singlestore';
import type { SQLiteConnection } from '@/dialects/sqlite';
import type { TursoConnection } from '@/dialects/turso';

// ========================================================================
// DATABASE CONNECTION UNIONS
// ========================================================================

export type DatabaseConnection =
  | PostgresConnection
  | SQLiteConnection
  | MysqlConnection
  | TursoConnection
  | SingleStoreConnection
  | GelConnection;
