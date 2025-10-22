/**
 * Privacy Scanner API
 * Scans text for sensitive data (SSN, credit cards, API keys, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { scanForSensitiveData } from '@/lib/security/privacy-scanner';

const scanSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  context: z
    .object({
      isReply: z.boolean().optional(),
      recipientDomain: z.string().optional(),
    })
    .optional(),
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
    const validatedData = scanSchema.parse(body);

    // Perform privacy scan
    const result = await scanForSensitiveData(
      validatedData.text,
      validatedData.context
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Privacy scan error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scan for sensitive data' },
      { status: 500 }
    );
  }
}
