import type { EnvironmentKey } from '@/definitions';
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
  envName: EnvironmentKey
): void {
  // Validate drizzle-kit is available
  validateDrizzleKit();

  // Execute the command
  executeCommand(command, configPath, envName as string);
}
