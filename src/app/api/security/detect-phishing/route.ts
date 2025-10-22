/**
 * Phishing Detection API
 * Analyzes emails for phishing indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  detectPhishing,
  type EmailSecurityData,
} from '@/lib/security/phishing-detector';

const phishingSchema = z.object({
  emailId: z.string(),
  fromAddress: z.string().email(),
  fromName: z.string().optional(),
  subject: z.string(),
  bodyText: z.string(),
  bodyHtml: z.string().optional(),
  links: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        contentType: z.string(),
      })
    )
    .optional(),
  headers: z.record(z.string()).optional(),
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
    const validatedData = phishingSchema.parse(body);

    // Perform phishing detection
    const emailData: EmailSecurityData = {
      fromAddress: validatedData.fromAddress,
      fromName: validatedData.fromName,
      subject: validatedData.subject,
      bodyText: validatedData.bodyText,
      bodyHtml: validatedData.bodyHtml,
      links: validatedData.links,
      attachments: validatedData.attachments,
      headers: validatedData.headers,
    };

    const analysis = await detectPhishing(emailData);

    // Log the analysis for auditing (optional)
    if (analysis.isPhishing && analysis.confidence > 80) {
      console.warn(`⚠️ High-confidence phishing detected:`, {
        emailId: validatedData.emailId,
        from: validatedData.fromAddress,
        subject: validatedData.subject,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Phishing detection error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze email for phishing' },
      { status: 500 }
    );
  }
}
