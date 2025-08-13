import chalk from 'chalk';
import { Command } from 'commander';

import { executeDrizzleCommand } from './drop.action';
import { type DropOptions, runDropPreflight } from './drop.preflight';

export const drop = new Command()
  .name('drop')
  .description('Drop migrations folder (drizzle-kit default behavior)')
  .action(async (options: DropOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfigPath } = await runDropPreflight({
        ...options,
        configPath
      });

      // Execute the action (environment already loaded in preflight)
      executeDrizzleCommand('drop', drizzleConfigPath);

      console.log(chalk.green('\nDrop completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nDrop failed: ${error}`));
      process.exit(1);
    }
  });
