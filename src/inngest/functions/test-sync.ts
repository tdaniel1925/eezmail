import { inngest } from '../client';

/**
 * Test sync function to verify Inngest is working
 */
export const testSync = inngest.createFunction(
  { id: 'test-sync' },
  { event: 'test/sync' },
  async ({ event, step }) => {
    console.log('🔵 Test sync starting...');

    const result1 = await step.run('step-1', async () => {
      console.log('✅ Running step 1');
      return { message: 'Step 1 complete!', data: event.data };
    });

    const result2 = await step.run('step-2', async () => {
      console.log('✅ Running step 2');
      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { message: 'Step 2 complete!', previousResult: result1 };
    });

    const result3 = await step.run('step-3', async () => {
      console.log('✅ Running step 3');
      return {
        message: 'All steps complete!',
        totalSteps: 3,
        results: [result1, result2],
      };
    });

    console.log('🎉 Test sync completed successfully!');

    return {
      success: true,
      completedSteps: 3,
      finalResult: result3,
    };
  }
);
