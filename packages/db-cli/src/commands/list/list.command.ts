import chalk from 'chalk';
import { Command, Option } from 'commander';

import { ENV_CHOICES } from '@/definitions';
import { executeListTables } from './list.action';
import { type ListOptions, runListPreflight } from './list.preflight';

export const list = new Command()
  .name('list')
  .alias('ls')
  .description('List database tables and schemas')
  .addOption(
    new Option('-e, --env <name>', 'Target environment').choices(ENV_CHOICES)
  )
  .option('--count', 'Include row counts for each table')
  .option('-l', 'Long format - include row counts (alias for --count)')
  .option('--compact', 'Use compact output format')
  .action(async (options: ListOptions, command) => {
    try {
      // Get global config option from parent command
      const globalOptions = command.parent?.opts() || {};
      const configPath = globalOptions.config;

      // Run preflight checks and setup
      const { drizzleConfig, includeRowCounts, compact } =
        await runListPreflight({
          ...options,
          configPath,
        });

      // Execute the action
      await executeListTables(drizzleConfig, includeRowCounts, compact);

      console.log(chalk.green('\nList operation completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nList operation failed: ${error}`));
      process.exit(1);
    }
  });
