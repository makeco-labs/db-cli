import chalk from 'chalk';
import { Command } from 'commander';

import { executeDrizzleCommand } from './generate.action';
import {
  type GenerateOptions,
  runGeneratePreflight,
} from './generate.preflight';

export const generate = new Command()
  .name('generate')
  .description('Generate new migrations from schema changes')
  .action(async (options: GenerateOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfigPath } = await runGeneratePreflight({
        ...options,
        configPath,
      });

      // Execute the action (environment already loaded in preflight)
      executeDrizzleCommand('generate', drizzleConfigPath);

      console.log(chalk.green('\nGeneration completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nGeneration failed: ${error}`));
      process.exit(1);
    }
  });
