import type { Config } from 'drizzle-kit';
import type { ConnectionOptions } from 'tls';

// Re-export the core types
export type { Config } from 'drizzle-kit';
export type { PostgresConnection, PostgresCredentials } from './postgres';
export type { SQLiteConnection, SqliteCredentials } from './sqlite';

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
  drizzleConfig: string;  // Path to drizzle.config.ts
  seed: string;           // Path to seed file
}

/**
 * Helper function to define db-cli configuration with type safety
 */
export function defineConfig(config: DbCliConfig): DbCliConfig {
  return config;
}


// Union type for all database connections
export type DatabaseConnection =
  | import('./postgres').PostgresConnection
  | import('./sqlite').SQLiteConnection;

// Specific config types for PostgreSQL
export type PostgresConfigWithHost = Config & {
  dialect: 'postgresql';
  dbCredentials: {
    host: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    ssl?: boolean | 'require' | 'allow' | 'prefer' | 'verify-full' | ConnectionOptions;
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

// Supported config type (excludes unsupported dialects)
export type SupportedConfig = PostgresConfig | SqliteConfig;