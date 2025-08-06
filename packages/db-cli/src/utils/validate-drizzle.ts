import { execSync } from 'node:child_process';

/**
 * Validates that drizzle-kit is available in the project
 */
export function validateDrizzleKit(): void {
  try {
    execSync('npx drizzle-kit --version', { stdio: 'pipe' });
  } catch {
    console.error(
      '❌ Error: drizzle-kit not found. Please install drizzle-kit as a dependency.'
    );
    process.exit(1);
  }
}
