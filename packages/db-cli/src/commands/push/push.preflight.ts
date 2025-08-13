import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface PushOptions {
  configPath?: string;
  env?: EnvironmentKey;
}

export interface PushPreflightResult {
  drizzleConfigPath: string;
  chosenEnv: EnvironmentKey;
}

export async function runPushPreflight(
  options: PushOptions
): Promise<PushPreflightResult> {
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
