import type { EnvironmentKey } from '@/definitions';
import { executeCommand, validateDrizzleKit } from '@/utils';

// ========================================================================
// PUSH ACTION
// ========================================================================

/**
 * Executes a drizzle-kit push command with validation
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
