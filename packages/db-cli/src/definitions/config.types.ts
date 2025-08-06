import type { GelConfig } from '@/dialects/gel';
import type { MysqlConfig } from '@/dialects/mysql';
import type { PostgresConfig } from '@/dialects/postgres';
import type { SingleStoreConfig } from '@/dialects/singlestore';
import type { SqliteConfig } from '@/dialects/sqlite';
import type { TursoConfig } from '@/dialects/turso';

// ========================================================================
// DB-CLI CONFIGURATION
// ========================================================================

export interface DbConfig {
  drizzleConfig: string; // Path to drizzle.config.ts
  seed?: string; // Optional path to seed file
}

// ========================================================================
// SUPPORTED CONFIG TYPES
// ========================================================================

// Supported config type (union of all dialect configs)
export type SupportedConfig =
  | PostgresConfig
  | SqliteConfig
  | MysqlConfig
  | TursoConfig
  | SingleStoreConfig
  | GelConfig;
