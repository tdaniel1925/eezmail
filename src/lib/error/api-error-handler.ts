import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Predefined error types
export const ApiErrors = {
  UNAUTHORIZED: new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  FORBIDDEN: new AppError('Forbidden', 403, 'FORBIDDEN'),
  NOT_FOUND: new AppError('Not found', 404, 'NOT_FOUND'),
  VALIDATION_ERROR: new AppError('Validation error', 400, 'VALIDATION_ERROR'),
  RATE_LIMITED: new AppError('Rate limited', 429, 'RATE_LIMITED'),
  INTERNAL_ERROR: new AppError('Internal server error', 500, 'INTERNAL_ERROR'),
  SERVICE_UNAVAILABLE: new AppError(
    'Service unavailable',
    503,
    'SERVICE_UNAVAILABLE'
  ),
} as const;

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle database errors
  if (error instanceof Error && error.message.includes('duplicate key')) {
    return NextResponse.json(
      {
        error: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
      },
      { status: 409 }
    );
  }

  // Handle authentication errors
  if (error instanceof Error && error.message.includes('auth')) {
    return NextResponse.json(
      {
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // Handle network/timeout errors
  if (
    error instanceof Error &&
    (error.message.includes('timeout') || error.message.includes('network'))
  ) {
    return NextResponse.json(
      {
        error: 'Request timeout',
        code: 'TIMEOUT_ERROR',
      },
      { status: 408 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    },
    { status: 500 }
  );
}

// Wrapper for API route handlers
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Utility function for creating standardized error responses
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code: string = 'ERROR',
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
    },
    { status: statusCode }
  );
}

// Utility function for creating success responses
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}
