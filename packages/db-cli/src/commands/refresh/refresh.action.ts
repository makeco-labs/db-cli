import type { Config } from 'drizzle-kit';
import type { EnvironmentKey } from '@/definitions';
import { executeCommand, validateDrizzleKit } from '@/utils';
import { resetDatabase } from '../reset/reset.action';

// ========================================================================
// REFRESH WORKFLOW ACTION
// ========================================================================

/**
 * Executes a workflow (sequence of commands)
 */
export async function executeRefreshWorkflow(
  workflow: readonly string[],
  configPath: string,
  config: Config,
  envName: EnvironmentKey
): Promise<void> {
  console.log(`Executing workflow: ${workflow.join(' → ')}`);

  // Validate drizzle-kit is available for the workflow
  validateDrizzleKit();

  for (const step of workflow) {
    console.log(`\nStep: ${step}`);

    if (step === 'reset') {
      // Use the resetDatabase function directly
      const result = await resetDatabase(config);
      if (!result.success) {
        throw new Error(result.error || 'Reset step failed');
      }
      if (result.tablesDropped.length > 0) {
        console.log(
          `Dropped ${result.tablesDropped.length} tables/schemas:`,
          result.tablesDropped.join(', ')
        );
      }
    } else {
      executeCommand(step, configPath);
    }
  }

  console.log('\n✅ Workflow completed successfully!');
}
