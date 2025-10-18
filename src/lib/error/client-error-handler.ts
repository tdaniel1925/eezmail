'use client';

import { toast } from 'sonner';

export interface ClientError {
  message: string;
  code?: string;
  details?: any;
}

export class ClientErrorHandler {
  private static instance: ClientErrorHandler;
  private errorLog: ClientError[] = [];

  private constructor() {}

  public static getInstance(): ClientErrorHandler {
    if (!ClientErrorHandler.instance) {
      ClientErrorHandler.instance = new ClientErrorHandler();
    }
    return ClientErrorHandler.instance;
  }

  public handleError(error: unknown, context?: string): void {
    const clientError = this.parseError(error);

    // Log error
    this.logError(clientError, context);

    // Show user-friendly message
    this.showUserMessage(clientError);

    // TODO: Send to monitoring service in production
    this.sendToMonitoring(clientError, context);
  }

  private parseError(error: unknown): ClientError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name,
        details: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        code: 'STRING_ERROR',
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        message: (error as any).message,
        code: (error as any).code,
        details: error,
      };
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: error,
    };
  }

  private logError(error: ClientError, context?: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      ...error,
      context,
      timestamp,
    };

    this.errorLog.push(logEntry);

    // Keep only last 100 errors to prevent memory issues
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', logEntry);
    }
  }

  private showUserMessage(error: ClientError): void {
    // Map error codes to user-friendly messages
    const userMessage = this.getUserFriendlyMessage(error);

    // Show toast notification
    toast.error(userMessage, {
      duration: 5000,
      description: error.code ? `Error code: ${error.code}` : undefined,
    });
  }

  private getUserFriendlyMessage(error: ClientError): string {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Authentication errors
    if (
      error.message.includes('auth') ||
      error.message.includes('unauthorized')
    ) {
      return 'Authentication error. Please log in again.';
    }

    // Validation errors
    if (
      error.message.includes('validation') ||
      error.message.includes('invalid')
    ) {
      return 'Please check your input and try again.';
    }

    // Rate limiting
    if (
      error.message.includes('rate limit') ||
      error.message.includes('too many')
    ) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // File upload errors
    if (error.message.includes('file') || error.message.includes('upload')) {
      return 'File upload failed. Please try again with a smaller file.';
    }

    // Email errors
    if (error.message.includes('email') || error.message.includes('send')) {
      return 'Email operation failed. Please try again.';
    }

    // AI service errors
    if (error.message.includes('ai') || error.message.includes('openai')) {
      return 'AI service temporarily unavailable. Please try again later.';
    }

    // Default message
    return error.message || 'Something went wrong. Please try again.';
  }

  private sendToMonitoring(error: ClientError, context?: string): void {
    // TODO: Implement monitoring service integration
    // Example: sendToSentry(error, context);
    // Example: sendToLogRocket(error, context);

    if (process.env.NODE_ENV === 'production') {
      // Send to production monitoring service
      console.log('Would send to monitoring service:', { error, context });
    }
  }

  public getErrorLog(): ClientError[] {
    return [...this.errorLog];
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }

  public getLastError(): ClientError | null {
    return this.errorLog.length > 0
      ? this.errorLog[this.errorLog.length - 1]
      : null;
  }
}

// Export singleton instance
export const errorHandler = ClientErrorHandler.getInstance();

// Hook for using error handler in React components
export function useErrorHandler() {
  return {
    handleError: (error: unknown, context?: string) => {
      errorHandler.handleError(error, context);
    },
    getErrorLog: () => errorHandler.getErrorLog(),
    clearErrorLog: () => errorHandler.clearErrorLog(),
    getLastError: () => errorHandler.getLastError(),
  };
}

// Utility function for handling async operations
export async function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    errorHandler.handleError(error, context);
    return null;
  }
}

// Utility function for handling API responses
export function handleApiResponse<T>(
  response: Response,
  context?: string
): Promise<T | null> {
  return handleAsyncError(async () => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }
    return response.json();
  }, context);
}
