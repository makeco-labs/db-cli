import chalk from 'chalk';
import { Command } from 'commander';

import { executeRefreshWorkflow } from './refresh.action';
import { type RefreshOptions, runRefreshPreflight } from './refresh.preflight';

export const refresh = new Command()
  .name('refresh')
  .description(
    'Complete refresh: drop migrations → generate → clear data → migrate'
  )
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: RefreshOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfig, drizzleConfigPath, chosenEnv } =
        await runRefreshPreflight(options);

      // Execute the action
      await executeRefreshWorkflow(
        ['drop', 'generate', 'reset', 'migrate'],
        drizzleConfigPath,
        drizzleConfig,
        chosenEnv
      );

      console.log(chalk.green('\nRefresh workflow completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nRefresh workflow failed: ${error}`));
      process.exit(1);
    }
  });
