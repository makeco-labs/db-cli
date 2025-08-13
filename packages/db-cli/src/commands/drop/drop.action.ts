import { executeCommand, validateDrizzleKit } from '@/utils';

// ========================================================================
// DROP ACTION
// ========================================================================

/**
 * Executes a drizzle-kit drop command with validation
 */
export function executeDrizzleCommand(
  command: string,
  configPath: string,
): void {
  // Validate drizzle-kit is available
  validateDrizzleKit();

  executeCommand(command, configPath);
}
