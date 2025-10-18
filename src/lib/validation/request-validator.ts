import { NextRequest } from 'next/server';
import { z } from 'zod';

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export class RequestValidator {
  private static validateHeaders(request: NextRequest, schema?: z.ZodSchema) {
    if (!schema) return {};

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return schema.parse(headers);
  }

  private static validateQuery(request: NextRequest, schema?: z.ZodSchema) {
    if (!schema) return {};

    const url = new URL(request.url);
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return schema.parse(query);
  }

  private static async validateBody(
    request: NextRequest,
    schema?: z.ZodSchema
  ) {
    if (!schema) return {};

    const body = await request.json();
    return schema.parse(body);
  }

  public static async validateRequest(
    request: NextRequest,
    options: ValidationOptions
  ) {
    const result: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
    } = {};

    try {
      // Validate headers
      if (options.headers) {
        result.headers = this.validateHeaders(request, options.headers);
      }

      // Validate query parameters
      if (options.query) {
        result.query = this.validateQuery(request, options.query);
      }

      // Validate request body
      if (options.body) {
        result.body = await this.validateBody(request, options.body);
      }

      // Validate route parameters (if needed)
      if (options.params) {
        // This would need to be implemented based on your routing setup
        // For now, we'll skip this as Next.js handles params differently
      }

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation error',
          details: error.errors,
        };
      }
      throw error;
    }
  }
}

// Common validation schemas
export const CommonSchemas = {
  // Pagination
  pagination: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
    offset: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 0)),
  }),

  // Sorting
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),

  // Date range
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),

  // Email address
  emailAddress: z.string().email('Invalid email address'),

  // UUID
  uuid: z.string().uuid('Invalid UUID'),

  // File upload
  fileUpload: z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().min(1, 'File size must be greater than 0'),
    type: z.string().min(1, 'File type is required'),
    data: z.string().min(1, 'File data is required'),
  }),

  // Search query
  searchQuery: z.object({
    q: z.string().min(1, 'Search query is required'),
    filters: z.record(z.any()).optional(),
  }),

  // Authentication headers
  authHeaders: z.object({
    authorization: z.string().optional(),
    'x-api-key': z.string().optional(),
  }),

  // Rate limiting headers
  rateLimitHeaders: z.object({
    'x-rate-limit-limit': z.string().optional(),
    'x-rate-limit-remaining': z.string().optional(),
    'x-rate-limit-reset': z.string().optional(),
  }),
};

// Email-specific validation schemas
export const EmailSchemas = {
  sendEmail: z.object({
    to: z.string().email('Invalid recipient email'),
    cc: z.string().email().optional(),
    bcc: z.string().email().optional(),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .max(200, 'Subject too long'),
    body: z.string().min(1, 'Body is required'),
    isHtml: z.boolean().optional().default(true),
    attachments: z.array(CommonSchemas.fileUpload).optional().default([]),
    scheduledFor: z.string().datetime().optional(),
    draftId: z.string().uuid().optional(),
  }),

  markRead: z.object({
    emailIds: z
      .array(z.string().uuid())
      .min(1, 'At least one email ID is required'),
    read: z.boolean().default(true),
  }),

  searchEmails: z.object({
    query: z.string().min(1, 'Search query is required'),
    folderId: z.string().uuid().optional(),
    accountId: z.string().uuid().optional(),
    unreadOnly: z.boolean().optional().default(false),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z
      .enum(['date', 'subject', 'from', 'relevance'])
      .optional()
      .default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    ...CommonSchemas.pagination.shape,
  }),

  syncEmails: z.object({
    accountId: z.string().uuid().optional(),
    limit: z.number().min(1).max(100).optional().default(50),
    offset: z.number().min(0).optional().default(0),
    unreadOnly: z.boolean().optional().default(false),
    folderId: z.string().uuid().optional(),
  }),
};

// AI-specific validation schemas
export const AISchemas = {
  generateSummary: z.object({
    emailId: z.string().uuid().optional(),
    text: z.string().min(1, 'Text to summarize is required'),
    type: z.enum(['email', 'thread', 'attachment']).optional().default('email'),
    maxLength: z.number().min(50).max(500).optional().default(200),
  }),

  generateQuickReplies: z.object({
    emailId: z.string().uuid().optional(),
    context: z.string().min(1, 'Context is required'),
    tone: z
      .enum(['professional', 'casual', 'friendly', 'formal'])
      .optional()
      .default('professional'),
    maxReplies: z.number().min(1).max(5).optional().default(3),
  }),

  screenEmail: z.object({
    emailId: z.string().uuid().optional(),
    from: z.string().email('Invalid sender email'),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Body is required'),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
        })
      )
      .optional()
      .default([]),
  }),

  chat: z.object({
    message: z.string().min(1, 'Message is required'),
    context: z
      .object({
        emailId: z.string().uuid().optional(),
        threadId: z.string().uuid().optional(),
        folderId: z.string().uuid().optional(),
      })
      .optional(),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
          timestamp: z.string().datetime(),
        })
      )
      .optional()
      .default([]),
    maxTokens: z.number().min(50).max(2000).optional().default(500),
  }),
};

// Utility function for creating validated API handlers
export function createValidatedHandler<T>(
  validationOptions: ValidationOptions,
  handler: (request: NextRequest, validatedData: T) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const validation = await RequestValidator.validateRequest(
      request,
      validationOptions
    );

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error,
          details: validation.details,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request, validation.data as T);
  };
}
