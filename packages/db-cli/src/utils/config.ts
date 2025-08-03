import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Config } from 'drizzle-kit';
import type {
  DbCliConfig,
  GelConfig,
  GelConfigBasic,
  GelConfigWithHost,
  GelConfigWithUrl,
  GelCredentials,
  MysqlConfig,
  MysqlConfigWithHost,
  MysqlConfigWithUrl,
  MysqlCredentials,
  PostgresConfig,
  PostgresConfigAwsDataApi,
  PostgresConfigPglite,
  PostgresConfigWithHost,
  PostgresConfigWithUrl,
  PostgresCredentials,
  SingleStoreConfig,
  SingleStoreConfigWithHost,
  SingleStoreConfigWithUrl,
  SingleStoreCredentials,
  SqliteConfig,
  SqliteConfigD1Http,
  SqliteConfigDurable,
  SqliteConfigExpo,
  SqliteConfigWithUrl,
  SqliteCredentials,
  TursoConfig,
} from '../types';

// ========================================================================
// TYPESCRIPT COMPILATION UTILITIES
// ========================================================================

const safeRegister = async () => {
  const { register } = await import('esbuild-register/dist/node');
  let res: { unregister: () => void };
  try {
    res = register({
      format: 'cjs',
      loader: 'ts',
    });
  } catch {
    // tsx fallback
    res = {
      unregister: () => {
        // No-op for tsx fallback
      },
    };
  }
  return res;
};

// ========================================================================
// CONFIG DISCOVERY FUNCTIONS (moved from db-cli.ts)
// ========================================================================

/**
 * Discovers drizzle config file in the current working directory
 */
export function discoverDrizzleConfig(): string | null {
  const configPatterns = [
    'drizzle.config.ts',
    'drizzle.config.js',
    'drizzle.config.mjs',
    'drizzle.config.cjs',
  ];
  const cwd = process.cwd();

  for (const pattern of configPatterns) {
    const configPath = path.join(cwd, pattern);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Discovers db config file in the current working directory
 */
export function discoverDbCliConfig(): string | null {
  const configPatterns = [
    'db.config.ts',
    'db.config.js',
    'db.config.mjs',
    'db.config.cjs',
  ];
  const cwd = process.cwd();

  for (const pattern of configPatterns) {
    const configPath = path.join(cwd, pattern);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

/**
 * Validates that a config path exists
 */
export function validateConfigPath(configPath: string | null): string {
  if (!configPath) {
    console.error('❌ Error: No drizzle config file found.');
    console.error(
      'Expected files: drizzle.config.ts, drizzle.config.js, drizzle.config.mjs, or drizzle.config.cjs'
    );
    console.error('Or specify a config file with --config flag');
    process.exit(1);
  }
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: Config file not found: ${configPath}`);
    process.exit(1);
  }
  return configPath;
}

/**
 * Loads and parses a drizzle config file
 */
export async function loadConfig(configPath: string): Promise<Config> {
  try {
    const absolutePath = path.resolve(configPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    const config = required.default ?? required;
    unregister();

    // Validate that we have a valid config
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid config file: ${configPath}`);
    }
    if (!config.dialect) {
      throw new Error(
        `Config file missing required 'dialect' field: ${configPath}`
      );
    }
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load config file: ${configPath}`);
  }
}

/**
 * Loads and parses a db config file
 */
export async function loadDbCliConfig(
  configPath: string
): Promise<DbCliConfig> {
  try {
    const absolutePath = path.resolve(configPath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`db config file not found: ${configPath}`);
    }

    const { unregister } = await safeRegister();
    const require = createRequire(import.meta.url);
    const required = require(absolutePath);
    const config = required.default ?? required;
    unregister();

    // Validate that we have a valid db config
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid db config file: ${configPath}`);
    }
    if (!config.drizzleConfig) {
      throw new Error(
        `db config file missing required 'drizzleConfig' field: ${configPath}`
      );
    }
    if (!config.seed) {
      throw new Error(
        `db config file missing required 'seed' field: ${configPath}`
      );
    }
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load db config file: ${configPath}`);
  }
}

/**
 * Resolves both db and drizzle configs based on discovery priority
 */
export async function resolveConfigs(configPath?: string): Promise<{
  drizzleConfig: Config;
  dbCliConfig?: DbCliConfig;
  configPath: string;
}> {
  let dbCliConfig: DbCliConfig | undefined;
  let drizzleConfigPath: string;

  // Determine config discovery strategy
  if (configPath) {
    if (configPath.includes('db.config')) {
      // User provided a db.config file
      dbCliConfig = await loadDbCliConfig(configPath);
      drizzleConfigPath = path.resolve(dbCliConfig.drizzleConfig);
    } else {
      // User provided a drizzle config file directly
      drizzleConfigPath = configPath;
    }
  } else {
    // Auto-discovery: try db.config first, then drizzle config
    const discoveredDbConfig = discoverDbCliConfig();
    if (discoveredDbConfig) {
      dbCliConfig = await loadDbCliConfig(discoveredDbConfig);
      drizzleConfigPath = path.resolve(dbCliConfig.drizzleConfig);
    } else {
      const discoveredDrizzleConfig = discoverDrizzleConfig();
      drizzleConfigPath = validateConfigPath(discoveredDrizzleConfig);
    }
  }

  // Load the drizzle config
  const drizzleConfig = await loadConfig(drizzleConfigPath);

  return {
    drizzleConfig,
    dbCliConfig,
    configPath: drizzleConfigPath,
  };
}

// ========================================================================
// TYPE GUARDS AND CREDENTIAL EXTRACTION
// ========================================================================

// Type guards for PostgreSQL configs
export function isPostgresConfig(config: Config): config is PostgresConfig {
  return config.dialect === 'postgresql';
}

export function isPostgresConfigWithHost(
  config: Config
): config is PostgresConfigWithHost {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

export function isPostgresConfigWithUrl(
  config: Config
): config is PostgresConfigWithUrl {
  return (
    config.dialect === 'postgresql' &&
    !('driver' in config) &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

export function isPostgresConfigAwsDataApi(
  config: Config
): config is PostgresConfigAwsDataApi {
  return (
    config.dialect === 'postgresql' &&
    'driver' in config &&
    config.driver === 'aws-data-api'
  );
}

export function isPostgresConfigPglite(
  config: Config
): config is PostgresConfigPglite {
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

export function isSqliteConfigWithUrl(
  config: Config
): config is SqliteConfigWithUrl {
  return (
    config.dialect === 'sqlite' &&
    !('driver' in config) &&
    'dbCredentials' in config
  );
}

export function isTursoConfig(config: Config): config is TursoConfig {
  return config.dialect === 'turso';
}

export function isSqliteConfigD1Http(
  config: Config
): config is SqliteConfigD1Http {
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

export function isSqliteConfigDurable(
  config: Config
): config is SqliteConfigDurable {
  return (
    config.dialect === 'sqlite' &&
    'driver' in config &&
    config.driver === 'durable-sqlite'
  );
}

// Type guards for MySQL configs
export function isMysqlConfig(config: Config): config is MysqlConfig {
  return config.dialect === 'mysql';
}

export function isMysqlConfigWithHost(
  config: Config
): config is MysqlConfigWithHost {
  return (
    config.dialect === 'mysql' &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

export function isMysqlConfigWithUrl(
  config: Config
): config is MysqlConfigWithUrl {
  return (
    config.dialect === 'mysql' &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

// Type guards for SingleStore configs
export function isSingleStoreConfig(
  config: Config
): config is SingleStoreConfig {
  return config.dialect === 'singlestore';
}

export function isSingleStoreConfigWithHost(
  config: Config
): config is SingleStoreConfigWithHost {
  return (
    config.dialect === 'singlestore' &&
    'dbCredentials' in config &&
    'host' in config.dbCredentials
  );
}

export function isSingleStoreConfigWithUrl(
  config: Config
): config is SingleStoreConfigWithUrl {
  return (
    config.dialect === 'singlestore' &&
    'dbCredentials' in config &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

// Type guards for Gel configs
export function isGelConfig(config: Config): config is GelConfig {
  return config.dialect === 'gel';
}

export function isGelConfigWithHost(
  config: Config
): config is GelConfigWithHost {
  return (
    config.dialect === 'gel' &&
    'dbCredentials' in config &&
    !!config.dbCredentials &&
    'host' in config.dbCredentials
  );
}

export function isGelConfigWithUrl(config: Config): config is GelConfigWithUrl {
  return (
    config.dialect === 'gel' &&
    'dbCredentials' in config &&
    !!config.dbCredentials &&
    'url' in config.dbCredentials &&
    !('host' in config.dbCredentials)
  );
}

export function isGelConfigBasic(config: Config): config is GelConfigBasic {
  return (
    config.dialect === 'gel' &&
    !('dbCredentials' in config && config.dbCredentials)
  );
}

// Credential extraction functions
export function extractPostgresCredentials(
  config: PostgresConfig
): PostgresCredentials {
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
      ssl: config.dbCredentials.ssl as
        | boolean
        | 'require'
        | 'allow'
        | 'prefer'
        | 'verify-full'
        | Record<string, unknown>
        | undefined,
    };
  }

  throw new Error('Invalid PostgreSQL configuration');
}

export function extractSqliteCredentials(
  config: SqliteConfig
): SqliteCredentials {
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

export function extractTursoCredentials(config: TursoConfig): {
  url: string;
  authToken?: string;
} {
  return {
    url: config.dbCredentials.url,
    authToken: config.dbCredentials.authToken,
  };
}

export function extractMysqlCredentials(config: MysqlConfig): MysqlCredentials {
  if (isMysqlConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  if (isMysqlConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl,
    };
  }

  throw new Error('Invalid MySQL configuration');
}

export function extractSingleStoreCredentials(
  config: SingleStoreConfig
): SingleStoreCredentials {
  if (isSingleStoreConfigWithUrl(config)) {
    return { url: config.dbCredentials.url };
  }

  if (isSingleStoreConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      ssl: config.dbCredentials.ssl,
    };
  }

  throw new Error('Invalid SingleStore configuration');
}

export function extractGelCredentials(config: GelConfig): GelCredentials {
  if (isGelConfigBasic(config)) {
    return;
  }

  if (isGelConfigWithUrl(config)) {
    return {
      url: config.dbCredentials.url,
      tlsSecurity: config.dbCredentials.tlsSecurity,
    };
  }

  if (isGelConfigWithHost(config)) {
    return {
      host: config.dbCredentials.host,
      port: config.dbCredentials.port,
      user: config.dbCredentials.user,
      password: config.dbCredentials.password,
      database: config.dbCredentials.database,
      tlsSecurity: config.dbCredentials.tlsSecurity,
    };
  }

  throw new Error('Invalid Gel configuration');
}
