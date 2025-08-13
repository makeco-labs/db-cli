import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface MigrateOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface MigratePreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runMigratePreflight(
  options: MigrateOptions
): Promise<MigratePreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfigPath } = await resolveConfigs(options.configPath);

  return {
    drizzleConfigPath,
    chosenEnv,
  };
}
