import type { Config } from 'drizzle-kit';
import type { ConnectionOptions } from 'tls';

// Re-export the core types
export type { Config } from 'drizzle-kit';
export type { GelConnection, GelCredentials } from './dialects/gel';
export type { MysqlConnection, MysqlCredentials } from './dialects/mysql';
export type {
  PostgresConnection,
  PostgresCredentials,
} from './dialects/postgres';
export type {
  SingleStoreConnection,
  SingleStoreCredentials,
} from './dialects/singlestore';
export type { SQLiteConnection, SqliteCredentials } from './dialects/sqlite';
export type { TursoConnection, TursoCredentials } from './dialects/turso';

// Common result types
export interface CheckResult {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  version?: string;
}

export interface ResetResult {
  success: boolean;
  tablesDropped: string[];
  error?: string;
}

export interface TruncateResult {
  success: boolean;
  tablesTruncated: string[];
  error?: string;
}

export interface SeedResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

// db-cli specific configuration
export interface DbCliConfig {
  drizzleConfig: string; // Path to drizzle.config.ts
  seed: string; // Path to seed file
}

/**
 * Helper function to define db-cli configuration with type safety
 */
export function defineConfig(config: DbCliConfig): DbCliConfig {
  return config;
}

// Union type for all database connections
export type DatabaseConnection =
  | import('./dialects/postgres').PostgresConnection
  | import('./dialects/sqlite').SQLiteConnection
  | import('./dialects/mysql').MysqlConnection
  | import('./dialects/turso').TursoConnection
  | import('./dialects/singlestore').SingleStoreConnection
  | import('./dialects/gel').GelConnection;

// Specific config types for PostgreSQL
export type PostgresConfigWithHost = Config & {
  dialect: 'postgresql';
  dbCredentials: {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    ssl?:
      | boolean
      | 'require'
      | 'allow'
      | 'prefer'
      | 'verify-full'
      | ConnectionOptions;
  };
};

export type PostgresConfigWithUrl = Config & {
  dialect: 'postgresql';
  dbCredentials: {
    url: string;
  };
};

export type PostgresConfigAwsDataApi = Config & {
  dialect: 'postgresql';
  driver: 'aws-data-api';
  dbCredentials: {
    database: string;
    secretArn: string;
    resourceArn: string;
  };
};

export type PostgresConfigPglite = Config & {
  dialect: 'postgresql';
  driver: 'pglite';
  dbCredentials: {
    url: string;
  };
};

// Specific config types for SQLite
export type SqliteConfigWithUrl = Config & {
  dialect: 'sqlite';
  dbCredentials: {
    url: string;
  };
};

export type TursoConfig = Config & {
  dialect: 'turso';
  dbCredentials: {
    url: string;
    authToken?: string;
  };
};

export type SqliteConfigD1Http = Config & {
  dialect: 'sqlite';
  driver: 'd1-http';
  dbCredentials: {
    accountId: string;
    databaseId: string;
    token: string;
  };
};

export type SqliteConfigExpo = Config & {
  dialect: 'sqlite';
  driver: 'expo';
};

export type SqliteConfigDurable = Config & {
  dialect: 'sqlite';
  driver: 'durable-sqlite';
};

// Specific config types for MySQL
export type MysqlConfigWithHost = Config & {
  dialect: 'mysql';
  dbCredentials: {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    ssl?: string | Record<string, unknown>;
  };
};

export type MysqlConfigWithUrl = Config & {
  dialect: 'mysql';
  dbCredentials: {
    url: string;
  };
};

// Specific config types for SingleStore
export type SingleStoreConfigWithHost = Config & {
  dialect: 'singlestore';
  dbCredentials: {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    ssl?: string | Record<string, unknown>;
  };
};

export type SingleStoreConfigWithUrl = Config & {
  dialect: 'singlestore';
  dbCredentials: {
    url: string;
  };
};

// Specific config types for Gel
export type GelConfigWithHost = Config & {
  dialect: 'gel';
  dbCredentials: {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    tlsSecurity?: 'insecure' | 'no_host_verification' | 'strict' | 'default';
  };
};

export type GelConfigWithUrl = Config & {
  dialect: 'gel';
  dbCredentials: {
    url: string;
    tlsSecurity?: 'insecure' | 'no_host_verification' | 'strict' | 'default';
  };
};

export type GelConfigBasic = Config & {
  dialect: 'gel';
  dbCredentials?: undefined;
};

// Union types for dialect-specific configs
export type PostgresConfig =
  | PostgresConfigWithHost
  | PostgresConfigWithUrl
  | PostgresConfigAwsDataApi
  | PostgresConfigPglite;

export type SqliteConfig =
  | SqliteConfigWithUrl
  | TursoConfig
  | SqliteConfigD1Http
  | SqliteConfigExpo
  | SqliteConfigDurable;

export type MysqlConfig = MysqlConfigWithHost | MysqlConfigWithUrl;

export type SingleStoreConfig =
  | SingleStoreConfigWithHost
  | SingleStoreConfigWithUrl;

export type GelConfig = GelConfigWithHost | GelConfigWithUrl | GelConfigBasic;

// Supported config type (now includes all dialects)
export type SupportedConfig =
  | PostgresConfig
  | SqliteConfig
  | MysqlConfig
  | SingleStoreConfig
  | GelConfig;
