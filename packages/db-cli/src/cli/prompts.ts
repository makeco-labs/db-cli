import chalk from 'chalk';
import prompts from 'prompts';
import { onCancel } from './signals';

// Types for supported commands
export type ActionKey =
  | 'generate'
  | 'migrate'
  | 'studio'
  | 'drop'
  | 'push'
  | 'reset'
  | 'refresh'
  | 'check'
  | 'seed'
  | 'truncate';
export type EnvironmentKey = 'dev' | 'test' | 'staging' | 'prod';

const validActions: ActionKey[] = [
  'generate',
  'migrate',
  'studio',
  'drop',
  'push',
  'reset',
  'refresh',
  'check',
  'seed',
  'truncate',
];

const actionDescriptions: Record<ActionKey, string> = {
  generate: '[generate]: Generate new migrations',
  migrate: '[migrate]: Apply migrations',
  studio: '[studio]: Open Drizzle Studio',
  drop: '[drop]: Drop migrations folder',
  push: '[push]: Push schema changes',
  reset: '[reset]: Reset database data',
  refresh: '[refresh]: Refresh database (drop + generate + reset + migrate)',
  check: '[check]: Check database connection',
  seed: '[seed]: Seed database with initial data',
  truncate: '[truncate]: Truncate database (delete data, keep structure)',
};

/**
 * Determines the environment to be used, either from input or via interactive prompt
 */
export async function determineEnvironment(envInput?: string): Promise<string> {
  if (envInput) {
    return envInput;
  }

  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the target environment (required):'),
        choices: [
          { title: 'Development', value: 'dev' },
          { title: 'Test', value: 'test' },
          { title: 'Staging', value: 'staging' },
          { title: 'Production', value: 'prod' },
        ],
        initial: 1, // Default to 'test' for development
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(
        chalk.red('\nEnvironment selection is required. Operation canceled.')
      );
      process.exit(0);
    }

    console.log(
      chalk.green(`Environment selected: ${chalk.bold(response.value)}`)
    );
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during environment prompt:'), error);
    process.exit(1);
  }
}

/**
 * Determines the action to be performed, either from input or via interactive prompt
 */
export async function determineAction(
  actionInput?: string
): Promise<ActionKey> {
  if (actionInput && validActions.includes(actionInput as ActionKey)) {
    return actionInput as ActionKey;
  }

  try {
    const response = await prompts(
      {
        type: 'select',
        name: 'value',
        message: chalk.blue('Select the action to perform:'),
        choices: validActions.map((action) => ({
          title: actionDescriptions[action],
          value: action,
        })),
        initial: 0,
      },
      { onCancel }
    );

    if (!response.value) {
      console.log(chalk.red('\nOperation canceled.'));
      process.exit(0);
    }

    console.log(chalk.green(`Action selected: ${chalk.bold(response.value)}`));
    return response.value;
  } catch (error) {
    console.error(chalk.red('Error during action prompt:'), error);
    process.exit(1);
  }
}
