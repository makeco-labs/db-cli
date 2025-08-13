import type { EnvironmentKey } from '@/definitions';
import { executeCommand } from '@/utils';

// ========================================================================
// STUDIO ACTION
// ========================================================================

/**
 * Executes drizzle studio command (no drizzle-kit validation needed for studio)
 */
export function executeStudioCommand(
  command: string,
  configPath: string,
  envName: EnvironmentKey
): void {
  // Studio doesn't need drizzle-kit validation
  // Execute the command
  executeCommand(command, configPath);
}
