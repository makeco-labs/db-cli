import type { DbConfig } from '@/definitions';

/**
 * Helper function to define db-cli configuration with type safety
 * @param config - The configuration object
 * @returns The same configuration object with type validation
 */
export function defineConfig(config: DbConfig): DbConfig {
  return config;
}
