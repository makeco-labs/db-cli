import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeResetDatabase } from './reset.action';
import { type ResetOptions, runResetPreflight } from './reset.preflight';

export const reset = new Command()
  .name('reset')
  .description('Clear database data (drop all tables and schemas)')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: ResetOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;
      
      // Run preflight checks and setup
      const { drizzleConfig, chosenEnv } = await runResetPreflight({
        ...options,
        configPath: configPath
      });

      // Execute the action
      await executeResetDatabase(drizzleConfig, chosenEnv);

      console.log(chalk.green('\nReset completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nReset failed: ${error}`));
      process.exit(1);
    }
  });
