import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeRefreshWorkflow } from './refresh.action';
import { type RefreshOptions, runRefreshPreflight } from './refresh.preflight';

export const refresh = new Command()
  .name('refresh')
  .description(
    'Complete refresh: drop migrations → generate → clear data → migrate'
  )
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: RefreshOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfig, drizzleConfigPath, chosenEnv } =
        await runRefreshPreflight({
          ...options,
          configPath,
        });

      // Execute the action
      await executeRefreshWorkflow(
        ['drop', 'generate', 'reset', 'migrate'],
        drizzleConfigPath,
        drizzleConfig,
        chosenEnv
      );

      console.log(chalk.green('\nRefresh workflow completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nRefresh workflow failed: ${error}`));
      process.exit(1);
    }
  });
