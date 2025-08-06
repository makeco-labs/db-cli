import chalk from 'chalk';
import { Command } from 'commander';

import { executeDrizzleCommand } from './migrate.action';
import { type MigrateOptions, runMigratePreflight } from './migrate.preflight';

export const migrate = new Command()
  .name('migrate')
  .description('Apply pending migrations to the database')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: MigrateOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } =
        await runMigratePreflight(options);

      // Execute the action
      executeDrizzleCommand('migrate', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nMigration completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nMigration failed: ${error}`));
      process.exit(1);
    }
  });
