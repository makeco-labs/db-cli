import chalk from 'chalk';
import { Command } from 'commander';

import { executeStudioCommand } from './studio.action';
import { runStudioPreflight, type StudioOptions } from './studio.preflight';

export const studio = new Command()
  .name('studio')
  .description('Launch Drizzle Studio web interface')
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: StudioOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } =
        await runStudioPreflight(options);

      // Execute the action
      executeStudioCommand('studio', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nStudio session ended.'));
    } catch (error) {
      console.error(chalk.red(`\nStudio failed: ${error}`));
      process.exit(1);
    }
  });
