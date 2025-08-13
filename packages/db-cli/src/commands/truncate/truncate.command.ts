import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeTruncateDatabase } from './truncate.action';
import {
  runTruncatePreflight,
  type TruncateOptions,
} from './truncate.preflight';

export const truncate = new Command()
  .name('truncate')
  .description('Truncate database data while preserving table structure')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: TruncateOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;
      
      // Run preflight checks and setup
      const { drizzleConfig } = await runTruncatePreflight({
        ...options,
        configPath: configPath
      });

      // Execute the action
      await executeTruncateDatabase(drizzleConfig);

      console.log(chalk.green('\nTruncate completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nTruncate failed: ${error}`));
      process.exit(1);
    }
  });
