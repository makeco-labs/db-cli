import chalk from 'chalk';
import { Command } from 'commander';

import { executeResetDatabase } from './reset.action';
import { type ResetOptions, runResetPreflight } from './reset.preflight';

export const reset = new Command()
  .name('reset')
  .description('Clear database data (drop all tables and schemas)')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: ResetOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig, chosenEnv } = await runResetPreflight(options);

      // Execute the action
      await executeResetDatabase(drizzleConfig, chosenEnv);

      console.log(chalk.green('\nReset completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nReset failed: ${error}`));
      process.exit(1);
    }
  });
