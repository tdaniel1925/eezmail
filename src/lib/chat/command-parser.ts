/**
 * Command Parser
 * Parses natural language commands into structured intents
 */

export type ParsedIntent = {
  type: 'single' | 'multi-step';
  action: string;
  params: Record<string, any>;
  steps?: Array<{
    action: string;
    params: Record<string, any>;
    dependsOn?: number[];
  }>;
  confidence: number;
  dependencies?: string[];
  estimatedTime?: number;
};

/**
 * Parse command using NLU
 */
export function parseCommand(command: string): ParsedIntent {
  // Simple command parsing
  // In a real implementation, this would use more sophisticated NLU
  const lower = command.toLowerCase();

  if (lower.includes('find') || lower.includes('search')) {
    return {
      type: 'single',
      action: 'search',
      params: { query: command },
      confidence: 0.9,
    };
  }

  if (lower.includes('compose') || lower.includes('write')) {
    return {
      type: 'single',
      action: 'compose',
      params: { command },
      confidence: 0.9,
    };
  }

  if (lower.includes('create') && lower.includes('event')) {
    return {
      type: 'single',
      action: 'create_event',
      params: { command },
      confidence: 0.8,
    };
  }

  // Default fallback
  return {
    type: 'single',
    action: 'unknown',
    params: { command },
    confidence: 0.5,
  };
}

/**
 * Check if command is multi-step
 */
export function isMultiStepCommand(intent: ParsedIntent): boolean {
  return intent.type === 'multi-step';
}

/**
 * Validate dependencies
 */
export function validateDependencies(intent: ParsedIntent): {
  valid: boolean;
  missing?: string[];
} {
  if (!intent.dependencies || intent.dependencies.length === 0) {
    return { valid: true };
  }

  // Simple validation - can be expanded
  return { valid: true };
}

/**
 * Estimate execution time
 */
export function estimateExecutionTime(intent: ParsedIntent): number {
  if (intent.type === 'single') {
    return intent.estimatedTime || 1000; // 1 second default
  }

  // For multi-step, sum up all steps
  const steps = intent.steps || [];
  return steps.length * 2000; // 2 seconds per step
}

/**
 * Execute multi-step command
 */
export async function executeMultiStepCommand(
  intent: ParsedIntent,
  userId: string,
  executor: (action: string, params: any) => Promise<any>
): Promise<{ success: boolean; results: any[]; error?: string }> {
  try {
    const results: any[] = [];

    if (intent.type === 'single') {
      const result = await executor(intent.action, intent.params);
      results.push(result);
    } else if (intent.steps) {
      for (const step of intent.steps) {
        const result = await executor(step.action, step.params);
        results.push(result);
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error executing multi-step command:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Summarize multi-step results
 */
export function summarizeMultiStepResults(results: any[]): string {
  if (results.length === 0) {
    return 'No results to summarize.';
  }

  if (results.length === 1) {
    return `Completed 1 action successfully.`;
  }

  return `Completed ${results.length} actions successfully.`;
}
