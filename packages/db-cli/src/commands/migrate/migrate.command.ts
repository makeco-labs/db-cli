import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeDrizzleCommand } from './migrate.action';
import { type MigrateOptions, runMigratePreflight } from './migrate.preflight';

export const migrate = new Command()
  .name('migrate')
  .description('Apply pending migrations to the database')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .action(async (options: MigrateOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } = await runMigratePreflight({
        ...options,
        configPath,
      });

      // Execute the action
      executeDrizzleCommand('migrate', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nMigration completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nMigration failed: ${error}`));
      process.exit(1);
    }
  });
