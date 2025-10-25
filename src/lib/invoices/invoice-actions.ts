/**
 * Invoice Generation System
 * PDF generation, storage, and email delivery
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';

// Add invoices table to schema first
export const invoicesTable = {
  id: 'uuid',
  userId: 'uuid',
  organizationId: 'uuid',
  invoiceNumber: 'string',
  amount: 'decimal',
  status: 'string', // 'pending', 'paid', 'failed'
  type: 'string', // 'top_up', 'subscription'
  stripeInvoiceId: 'string',
  squareInvoiceId: 'string',
  pdfUrl: 'string',
  items: 'jsonb',
  billingDetails: 'jsonb',
  createdAt: 'timestamp',
  paidAt: 'timestamp',
};

// ============================================================================
// INVOICE GENERATION
// ============================================================================

export async function generateInvoice(data: {
  userId: string;
  organizationId?: string;
  amount: number;
  type: 'top_up' | 'subscription';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  stripeInvoiceId?: string;
  squareInvoiceId?: string;
}): Promise<{
  success: boolean;
  invoiceId?: string;
  pdfUrl?: string;
  error?: string;
}> {
  try {
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(db.schema.users.id, data.userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get organization details if applicable
    let organization = null;
    if (data.organizationId) {
      organization = await db.query.organizations.findFirst({
        where: eq(db.schema.organizations.id, data.organizationId),
      });
    }

    const billingDetails = {
      name: organization?.name || user.fullName || user.email,
      email: user.email,
      address: '', // TODO: Get from user profile
    };

    // Create invoice record
    const [invoice] = await db
      .insert(db.schema.invoices)
      .values({
        userId: data.userId,
        organizationId: data.organizationId || null,
        invoiceNumber,
        amount: data.amount.toFixed(2),
        status: 'paid',
        type: data.type,
        stripeInvoiceId: data.stripeInvoiceId || null,
        squareInvoiceId: data.squareInvoiceId || null,
        items: data.items,
        billingDetails,
        paidAt: new Date(),
      })
      .returning();

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      InvoiceTemplate({
        invoiceNumber,
        date: new Date(),
        items: data.items,
        total: data.amount,
        billingDetails,
      })
    );

    // TODO: Upload PDF to storage (Supabase Storage or S3)
    // For now, we'll skip the upload step
    const pdfUrl = `/api/invoices/${invoice.id}/download`;

    // Update invoice with PDF URL
    await db
      .update(db.schema.invoices)
      .set({ pdfUrl })
      .where(eq(db.schema.invoices.id, invoice.id));

    console.log(`✅ Generated invoice ${invoiceNumber}`);

    // Send email (async, don't wait)
    sendInvoiceEmail(invoice.id, user.email).catch((err) => {
      console.error('❌ Failed to send invoice email:', err);
    });

    return {
      success: true,
      invoiceId: invoice.id,
      pdfUrl,
    };
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// EMAIL DELIVERY
// ============================================================================

async function sendInvoiceEmail(
  invoiceId: string,
  recipientEmail: string
): Promise<void> {
  try {
    // TODO: Implement email sending via SendGrid, Postmark, or similar
    // For now, just log
    console.log(`📧 Would send invoice ${invoiceId} to ${recipientEmail}`);

    // Example with nodemailer (configure SMTP):
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject: `Invoice ${invoiceNumber} from Your Company`,
      html: `
        <h1>Thank you for your payment!</h1>
        <p>Please find your invoice attached.</p>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    */
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
  }
}

// ============================================================================
// INVOICE RETRIEVAL
// ============================================================================

export async function getUserInvoices(): Promise<{
  success: boolean;
  invoices?: Array<typeof db.schema.invoices.$inferSelect>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const userInvoices = await db.query.invoices.findMany({
      where: eq(db.schema.invoices.userId, user.id),
      orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    });

    return { success: true, invoices: userInvoices };
  } catch (error) {
    console.error('❌ Error getting invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getInvoice(invoiceId: string): Promise<{
  success: boolean;
  invoice?: typeof db.schema.invoices.$inferSelect;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const invoice = await db.query.invoices.findFirst({
      where: eq(db.schema.invoices.id, invoiceId),
    });

    if (!invoice || invoice.userId !== user.id) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, invoice };
  } catch (error) {
    console.error('❌ Error getting invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
