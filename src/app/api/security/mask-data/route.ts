/**
 * Data Masking API
 * Masks sensitive data in text
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  maskSensitiveData,
  type SensitiveDataMatch,
} from '@/lib/security/privacy-scanner';

const maskSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  matches: z.array(
    z.object({
      type: z.enum([
        'ssn',
        'credit_card',
        'api_key',
        'password',
        'phone',
        'address',
        'email',
        'custom',
      ]),
      value: z.string(),
      position: z.object({
        start: z.number(),
        end: z.number(),
      }),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      recommendation: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = maskSchema.parse(body);

    // Mask sensitive data
    const maskedText = maskSensitiveData(
      validatedData.text,
      validatedData.matches as SensitiveDataMatch[]
    );

    return NextResponse.json({
      success: true,
      maskedText,
    });
  } catch (error) {
    console.error('Data masking error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to mask data' }, { status: 500 });
  }
}
