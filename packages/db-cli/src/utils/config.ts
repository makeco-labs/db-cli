import type { Config } from 'drizzle-kit';
import type {
  PostgresConfig,
  PostgresConfigWithHost,
  PostgresConfigWithUrl,
  PostgresConfigAwsDataApi,
  PostgresConfigPglite,
  SqliteConfig,
  SqliteConfigWithUrl,
  TursoConfig,
  SqliteConfigD1Http,
  SqliteConfigExpo,
  SqliteConfigDurable,
  PostgresCredentials,
  SqliteCredentials,
} from '../types';

// Type guards for PostgreSQL configs
export function isPostgresConfig(config: Config): config is PostgresConfig {
  return config.dialect === 'postgresql';
}

export function isPostgresConfigWithHost(config: Config): config is PostgresConfigWithHost {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

export function isPostgresConfigWithUrl(config: Config): config is PostgresConfigWithUrl {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

export function isPostgresConfigAwsDataApi(config: Config): config is PostgresConfigAwsDataApi {
  return (
    config.dialect === 'postgresql' &&
    'driver' in config &&
    config.driver === 'aws-data-api'
  );
}

export function isPostgresConfigPglite(config: Config): config is PostgresConfigPglite {
  return (
    config.dialect === 'postgresql' &&
    'driver' in config &&
    config.driver === 'pglite'
  );
}

// Type guards for SQLite configs
export function isSqliteConfig(config: Config): config is SqliteConfig {
  return config.dialect === 'sqlite' || config.dialect === 'turso';
}

export function isSqliteConfigWithUrl(config: Config): config is SqliteConfigWithUrl {
  return (
    config.dialect === 'sqlite' &&
    !('driver' in config) &&
    'dbCredentials' in config
  );
}

export function isTursoConfig(config: Config): config is TursoConfig {
  return config.dialect === 'turso';
}

export function isSqliteConfigD1Http(config: Config): config is SqliteConfigD1Http {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'd1-http'
  );
}

export function isSqliteConfigExpo(config: Config): config is SqliteConfigExpo {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'expo'
  );
}

export function isSqliteConfigDurable(config: Config): config is SqliteConfigDurable {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'durable-sqlite'
  );
}

// Credential extraction functions
export function extractPostgresCredentials(config: PostgresConfig): PostgresCredentials {
  if (isPostgresConfigAwsDataApi(config)) {
    return {
      driver: 'aws-data-api',
      database: config.dbCredentials.database,
      secretArn: config.dbCredentials.secretArn,
      resourceArn: config.dbCredentials.resourceArn,
    };
  }

  if (isPostgresConfigPglite(config)) {
    return {
      driver: 'pglite',
      url: config.dbCredentials.url,
    };
  }

  if (isPostgresConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  if (isPostgresConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl as boolean | 'require' | 'allow' | 'prefer' | 'verify-full' | Record<string, unknown> | undefined,
    };
  }

  throw new Error('Invalid PostgreSQL configuration');
}

export function extractSqliteCredentials(config: SqliteConfig): SqliteCredentials {
  if (isTursoConfig(config)) {
    return {
      driver: 'turso',
      url: config.dbCredentials.url,
      authToken: config.dbCredentials.authToken,
    };
  }

  if (isSqliteConfigD1Http(config)) {
    return {
      driver: 'd1-http',
      accountId: config.dbCredentials.accountId,
      databaseId: config.dbCredentials.databaseId,
      token: config.dbCredentials.token,
    };
  }

  if (isSqliteConfigExpo(config) || isSqliteConfigDurable(config)) {
    throw new Error(`Driver ${config.driver} is not yet supported`);
  }

  if (isSqliteConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  throw new Error('Invalid SQLite configuration');
}