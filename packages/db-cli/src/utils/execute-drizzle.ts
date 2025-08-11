import { execSync } from 'node:child_process';
import { loadEnvironment } from './load-env';

import type { EnvironmentKey } from '@/definitions';

/**
 * Executes a drizzle-kit command using Node.js dotenv instead of dotenv-cli
 */
export function executeCommand(
  command: string,
  configPath: string,
  envName?: string
): void {
  // Load environment variables using sophisticated monorepo detection if envName provided
  if (envName) {
    loadEnvironment(envName as EnvironmentKey);
  }

  const fullCommand = `npx drizzle-kit ${command} --config="${configPath}"`;

  console.log(`Executing: ${fullCommand}`);

  try {
    execSync(fullCommand, {
      stdio: 'inherit',
      env: process.env, // Pass the current environment (including loaded .env vars)
    });
    console.log(`✅ Command completed successfully: ${command}`);
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error; // Re-throw to be caught by the caller
  }
}
