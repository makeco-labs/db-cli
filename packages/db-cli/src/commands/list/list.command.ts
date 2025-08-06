import chalk from 'chalk';
import { Command } from 'commander';

import { executeListTables } from './list.action';
import { type ListOptions, runListPreflight } from './list.preflight';

export const list = new Command()
  .name('list')
  .alias('ls')
  .description('List database tables and schemas')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .option('--count', 'Include row counts for each table')
  .option('-l', 'Long format - include row counts (alias for --count)')
  .option('--compact', 'Use compact output format')
  .action(async (options: ListOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig, includeRowCounts, compact } =
        await runListPreflight(options);

      // Execute the action
      await executeListTables(drizzleConfig, includeRowCounts, compact);

      console.log(chalk.green('\nList operation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nList operation failed: ${error}`));
      process.exit(1);
    }
  });
