/**
 * Payment Dunning Email Service
 * Handles sending payment failure and warning emails
 */

'use server';

import { Resend } from 'resend';
import {
  generatePaymentFailedEmail,
  generateFinalPaymentWarningEmail,
} from './templates/payment-failed';

// Lazy-load Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = 'billing@easemail.app';
const FROM_NAME = 'EaseMail Billing';

/**
 * Send payment failed email (first failure)
 */
export async function sendPaymentFailedEmail(
  to: string,
  data: {
    customerName: string;
    amount: string;
    nextRetryDate: string;
    updatePaymentUrl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generatePaymentFailedEmail(data);

    const { data: result, error } = await getResendClient().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: '⚠️ Payment Failed - Update Payment Method',
      html,
    });

    if (error) {
      console.error('Failed to send payment failed email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Sent payment failed email to:', to, 'ID:', result?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send final payment warning email (before cancellation)
 */
export async function sendFinalPaymentWarningEmail(
  to: string,
  data: {
    customerName: string;
    amount: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generateFinalPaymentWarningEmail(data);

    const { data: result, error } = await getResendClient().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: '🚨 URGENT: Final Payment Attempt - Subscription at Risk',
      html,
    });

    if (error) {
      console.error('Failed to send final payment warning:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Sent final payment warning to:', to, 'ID:', result?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending final payment warning:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
