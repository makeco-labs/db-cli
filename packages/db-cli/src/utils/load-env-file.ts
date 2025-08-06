import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Loads environment variables from a specific .env file
 */
export function loadEnvFile(envName: string): void {
  const envFile = `.env.${envName}`;
  const envPath = path.resolve(envFile);

  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envFile}`);
    dotenv.config({ path: envPath, override: true });
  } else {
    console.warn(`⚠️  Warning: Environment file not found: ${envFile}`);
  }
}
