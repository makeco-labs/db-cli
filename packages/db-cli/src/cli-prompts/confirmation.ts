import chalk from 'chalk';
import type { Config as DrizzleConfig } from 'drizzle-kit';
import prompts from 'prompts';

import type { EnvironmentKey } from '@/definitions';

/**
 * Require production confirmation for destructive operations
 */
export async function requireProductionConfirmation(
  operation: string,
  drizzleConfig: DrizzleConfig
): Promise<void> {
  const isProduction =
    (drizzleConfig.dialect === 'postgresql' &&
      'dbCredentials' in drizzleConfig &&
        typeof drizzleConfig.dbCredentials === 'object' &&
        drizzleConfig.dbCredentials &&
        'host' in drizzleConfig.dbCredentials &&
        typeof drizzleConfig.dbCredentials.host === 'string' &&
      drizzleConfig.dbCredentials.host.includes('prod')) ||
    ('dbCredentials' in drizzleConfig &&
      typeof drizzleConfig.dbCredentials === 'object' &&
      drizzleConfig.dbCredentials &&
      'connectionString' in drizzleConfig.dbCredentials &&
      typeof drizzleConfig.dbCredentials.connectionString === 'string' &&
      drizzleConfig.dbCredentials.connectionString.includes('prod'));

  if (isProduction) {
    console.log(
      chalk.red(
        `⚠️  Production environment detected for ${operation} operation.`
      )
    );
    console.log(
      chalk.red('This operation will permanently delete data from production!')
    );
    console.log(chalk.red('Please confirm by typing "CONFIRM" to proceed:'));

    const readline = require('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<void>((resolve) => {
      rl.question('', (answer: string) => {
        rl.close();
        if (answer !== 'CONFIRM') {
          console.log(chalk.yellow('Operation canceled.'));
          process.exit(0);
        }
        resolve();
      });
    });
  }
}

/**
 * Generic confirmation prompt for any action
 */
export async function requireConfirmation(input: {
  action: string;
  env?: EnvironmentKey;
}): Promise<void> {
  const { action, env } = input;

  if (env === 'prod') {
    const response = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message: chalk.red(
        `⚠️  You are about to ${action} in PRODUCTION. Are you sure?`
      ),
      initial: false,
    });

    if (!response.confirmed) {
      console.log(chalk.yellow('Operation canceled.'));
      process.exit(0);
    }
  }
}
