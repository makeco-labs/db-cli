import chalk from 'chalk';
import { Command } from 'commander';

import { executeTruncateDatabase } from './truncate.action';
import {
  runTruncatePreflight,
  type TruncateOptions,
} from './truncate.preflight';

export const truncate = new Command()
  .name('truncate')
  .description('Truncate database data while preserving table structure')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: TruncateOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig } = await runTruncatePreflight(options);

      // Execute the action
      await executeTruncateDatabase(drizzleConfig);

      console.log(chalk.green('\nTruncate completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nTruncate failed: ${error}`));
      process.exit(1);
    }
  });
