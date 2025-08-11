import type { EnvironmentKey } from '@/definitions';
import { executeCommand, validateDrizzleKit } from '@/utils';

// ========================================================================
// GENERATE ACTION
// ========================================================================

/**
 * Executes a drizzle-kit command with validation
 */
export function executeDrizzleCommand(
  command: string,
  configPath: string,
): void {
  // Validate drizzle-kit is available
  validateDrizzleKit();

  executeCommand(command, configPath);
}
