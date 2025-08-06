import fs from 'node:fs';
import path from 'node:path';

/**
 * Discovers db config file in the current working directory
 */
export function discoverDbConfig(): string | null {
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
