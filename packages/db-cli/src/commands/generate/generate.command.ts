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
  .option('-c, --config <path>', 'Path to db.config.ts file')
  .option('-e, --env <name>', 'Environment to load (.env.{name})')
  .action(async (options: GenerateOptions) => {
    try {
      // Run preflight checks and setup
      const { drizzleConfigPath, chosenEnv } =
        await runGeneratePreflight(options);

      // Execute the action
      executeDrizzleCommand('generate', drizzleConfigPath, chosenEnv);

      console.log(chalk.green('\nGeneration completed successfully.'));
    } catch (error) {
      console.error(chalk.red(`\nGeneration failed: ${error}`));
      process.exit(1);
    }
  });
