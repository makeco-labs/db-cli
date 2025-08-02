import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { pathToFileURL } from 'url';
import type { Config } from 'drizzle-kit';
import type {
  DbCliConfig,
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
 * Discovers db-cli config file in the current working directory
 */
export function discoverDbCliConfig(): string | null {
  const configPatterns = [
    'db-cli.config.ts',
    'db-cli.config.js',
    'db-cli.config.mjs',
    'db-cli.config.cjs',
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
    console.error('Expected files: drizzle.config.ts, drizzle.config.js, drizzle.config.mjs, or drizzle.config.cjs');
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
    let config: Config;
    if (absolutePath.endsWith('.ts')) {
      // For TypeScript files, we need to use tsx to execute them
      try {
        const result = execSync(`npx tsx -e "
          const config = require('${absolutePath}');
          console.log(JSON.stringify(config.default || config));
        "`, { encoding: 'utf8' });
        config = JSON.parse(result.trim());
      } catch {
        throw new Error(`Failed to load TypeScript config file: ${configPath}`);
      }
    } else {
      // For JS files, use dynamic import
      const fileUrl = pathToFileURL(absolutePath).href;
      const module = await import(fileUrl);
      config = module.default || module;
    }
    // Validate that we have a valid config
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid config file: ${configPath}`);
    }
    if (!config.dialect) {
      throw new Error(`Config file missing required 'dialect' field: ${configPath}`);
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
 * Loads and parses a db-cli config file
 */
export async function loadDbCliConfig(configPath: string): Promise<DbCliConfig> {
  try {
    const absolutePath = path.resolve(configPath);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`db-cli config file not found: ${configPath}`);
    }
    let config: DbCliConfig;
    if (absolutePath.endsWith('.ts')) {
      // For TypeScript files, we need to use tsx to execute them
      try {
        const result = execSync(`npx tsx -e "
          const config = require('${absolutePath}');
          console.log(JSON.stringify(config.default || config));
        "`, { encoding: 'utf8' });
        config = JSON.parse(result.trim());
      } catch {
        throw new Error(`Failed to load TypeScript db-cli config file: ${configPath}`);
      }
    } else {
      // For JS files, use dynamic import
      const fileUrl = pathToFileURL(absolutePath).href;
      const module = await import(fileUrl);
      config = module.default || module;
    }
    // Validate that we have a valid db-cli config
    if (!config || typeof config !== 'object') {
      throw new Error(`Invalid db-cli config file: ${configPath}`);
    }
    if (!config.drizzleConfig) {
      throw new Error(`db-cli config file missing required 'drizzleConfig' field: ${configPath}`);
    }
    if (!config.seed) {
      throw new Error(`db-cli config file missing required 'seed' field: ${configPath}`);
    }
    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to load db-cli config file: ${configPath}`);
  }
}

/**
 * Resolves both db-cli and drizzle configs based on discovery priority
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
    if (configPath.includes('db-cli.config')) {
      // User provided a db-cli config file
      dbCliConfig = await loadDbCliConfig(configPath);
      drizzleConfigPath = path.resolve(dbCliConfig.drizzleConfig);
    } else {
      // User provided a drizzle config file directly
      drizzleConfigPath = configPath;
    }
  } else {
    // Auto-discovery: try db-cli config first, then drizzle config
    const discoveredDbCliConfig = discoverDbCliConfig();
    if (discoveredDbCliConfig) {
      dbCliConfig = await loadDbCliConfig(discoveredDbCliConfig);
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