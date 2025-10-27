/**
 * Easy Email Sending Helpers
 *
 * This file provides simple, ready-to-use functions for sending all types of emails
 * using the templates and variables system.
 */

'use server';

import { sendNotification } from './notification-service';
import {
  getCombinedVariables,
  getPasswordResetVariables,
  getEmailVerificationVariables,
  getSecurityVariables,
  getSupportVariables,
  getFeatureVariables,
} from './template-variables';
import { db } from '@/lib/db';
import { users, sandboxCompanies, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// WELCOME EMAILS
// ============================================================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const variables = getCombinedVariables({ user });

    return await sendNotification({
      templateId: 'welcome-all-users', // Can use slug
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}

/**
 * Send welcome email to sandbox user
 */
export async function sendSandboxWelcomeEmail(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const company = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, companyId),
    });

    if (!user || !company) {
      return { success: false, error: 'User or company not found' };
    }

    const variables = getCombinedVariables({
      user,
      sandboxCompany: company,
    });

    return await sendNotification({
      templateId: 'welcome-sandbox-user',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending sandbox welcome email:', error);
    return { success: false, error: 'Failed to send sandbox welcome email' };
  }
}

// ============================================================================
// AUTH & SECURITY EMAILS
// ============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userId: string,
  resetToken: string,
  requestInfo?: { ip?: string; location?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const passwordResetVars = getPasswordResetVariables(
      resetToken,
      60,
      requestInfo
    );
    const variables = getCombinedVariables({
      user,
      passwordResetToken: resetToken,
      customVariables: passwordResetVars,
    });

    return await sendNotification({
      templateId: 'password-reset',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

/**
 * Send email verification
 */
export async function sendEmailVerification(
  userId: string,
  verificationToken: string,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const verificationVars = getEmailVerificationVariables(
      verificationToken,
      verificationCode,
      30
    );
    const variables = getCombinedVariables({
      user,
      verificationToken,
      verificationCode,
      customVariables: verificationVars,
    });

    return await sendNotification({
      templateId: 'email-verification',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending email verification:', error);
    return { success: false, error: 'Failed to send email verification' };
  }
}

/**
 * Send security alert
 */
export async function sendSecurityAlert(
  userId: string,
  event: {
    type: string;
    time: Date;
    ip?: string;
    location?: string;
    device?: string;
    actionRequired?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const securityVars = getSecurityVariables(event);
    const variables = getCombinedVariables({
      user,
      securityEvent: event,
      customVariables: securityVars,
    });

    return await sendNotification({
      templateId: 'security-alert',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending security alert:', error);
    return { success: false, error: 'Failed to send security alert' };
  }
}

// ============================================================================
// SUBSCRIPTION EMAILS
// ============================================================================

/**
 * Send subscription confirmation
 */
export async function sendSubscriptionConfirmation(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const variables = getCombinedVariables({
      user,
      subscription: subscription || undefined,
    });

    return await sendNotification({
      templateId: 'subscription-confirmed',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending subscription confirmation:', error);
    return {
      success: false,
      error: 'Failed to send subscription confirmation',
    };
  }
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  userId: string,
  retryDate: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const variables = getCombinedVariables({
      user,
      subscription: subscription || undefined,
      customVariables: {
        nextRetryDate: retryDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        updatePaymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      },
    });

    return await sendNotification({
      templateId: 'payment-failed',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    return { success: false, error: 'Failed to send payment failed email' };
  }
}

/**
 * Send trial ending soon reminder
 */
export async function sendTrialEndingEmail(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const variables = getCombinedVariables({
      user,
      subscription: subscription || undefined,
      customVariables: {
        upgradeLink: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      },
    });

    return await sendNotification({
      templateId: 'trial-ending-soon',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending trial ending email:', error);
    return { success: false, error: 'Failed to send trial ending email' };
  }
}

// ============================================================================
// SUPPORT & FEATURE EMAILS
// ============================================================================

/**
 * Send support ticket response
 */
export async function sendSupportTicketResponse(
  userId: string,
  ticket: {
    id: string;
    subject: string;
    status: string;
    agentName?: string;
    agentEmail?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const supportVars = getSupportVariables(ticket);
    const variables = getCombinedVariables({
      user,
      supportTicket: ticket,
      customVariables: supportVars,
    });

    return await sendNotification({
      templateId: 'support-ticket-response',
      recipientId: userId,
      variables,
    });
  } catch (error) {
    console.error('Error sending support ticket response:', error);
    return { success: false, error: 'Failed to send support ticket response' };
  }
}

/**
 * Send feature announcement to all users
 */
export async function sendFeatureAnnouncement(
  feature: {
    name: string;
    description: string;
    launchDate?: Date;
    link?: string;
  },
  audience: 'all' | 'individual' | 'team' | 'enterprise' = 'all'
): Promise<{ success: boolean; queuedCount: number; error?: string }> {
  try {
    // This would use bulk sending - implement based on your needs
    console.log(
      `Sending feature announcement: ${feature.name} to audience: ${audience}`
    );

    // TODO: Implement bulk sending logic
    return { success: true, queuedCount: 0 };
  } catch (error) {
    console.error('Error sending feature announcement:', error);
    return {
      success: false,
      queuedCount: 0,
      error: 'Failed to send feature announcement',
    };
  }
}

// ============================================================================
// EXPORT ALL HELPERS
// ============================================================================

export const emailHelpers = {
  // Welcome
  sendWelcomeEmail,
  sendSandboxWelcomeEmail,

  // Auth & Security
  sendPasswordResetEmail,
  sendEmailVerification,
  sendSecurityAlert,

  // Subscription
  sendSubscriptionConfirmation,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,

  // Support & Features
  sendSupportTicketResponse,
  sendFeatureAnnouncement,
};
