import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';

import { determineEnvironment } from '@/cli-prompts';
import type { EnvironmentKey } from '@/definitions';
import { loadEnvironment, resolveConfigs } from '@/utils';

export interface ListOptions {
  config?: string;
  env?: EnvironmentKey;
  count?: boolean;
  l?: boolean;
  compact?: boolean;
}

export interface ListPreflightResult {
  drizzleConfig: DrizzleConfig;
  includeRowCounts: boolean;
  compact: boolean;
  chosenEnv: EnvironmentKey;
}

export async function runListPreflight(
  options: ListOptions
): Promise<ListPreflightResult> {
  // Determine environment
  const chosenEnv = await determineEnvironment({ envInput: options.env });

  // Load environment variables
  loadEnvironment(chosenEnv);

  // Resolve configs
  const { drizzleConfig } = await resolveConfigs(options.config);

  // Process list-specific options
  const includeRowCounts = options.count || options.l || false;
  const compact = options.compact || false;

  console.log(
    chalk.cyan(`Using drizzle config (dialect: ${drizzleConfig.dialect})`)
  );

  return {
    drizzleConfig,
    includeRowCounts,
    compact,
    chosenEnv,
  };
}
