/**
 * Sandbox Company Notification Service
 * Handles email notifications for sandbox-related events
 */

'use server';

import { db } from '@/lib/db';
import { users, sandboxCompanies, notificationSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  SANDBOX_TEMPLATES,
  type SandboxTemplateType,
  type TemplateVariables,
} from './sandbox-email-templates';
import { format } from 'date-fns';

// Use your existing email infrastructure
// Update this import based on your actual email sending service
// For now, using a placeholder - you'll need to replace this with your actual service
interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Send email using your existing infrastructure
 * TODO: Replace with actual email sending service
 */
async function sendEmailViaService(params: EmailParams): Promise<boolean> {
  try {
    // PLACEHOLDER: Replace with your actual email sending implementation
    // Options:
    // 1. Use Nodemailer with SMTP
    // 2. Use SendGrid API
    // 3. Use Postmark API
    // 4. Use your existing sendEmail function from src/lib/email/send-email.ts

    console.log('📧 [Sandbox Notification] Sending email:', {
      to: params.to,
      subject: params.subject,
      from: params.from || 'noreply@easemail.ai',
    });

    // Example with console logging (replace with actual implementation)
    console.log('Email HTML Preview:', params.html.substring(0, 200) + '...');

    // TODO: Implement actual email sending
    // Example:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: params.to }] }],
    //     from: { email: params.from || 'noreply@easemail.ai' },
    //     subject: params.subject,
    //     content: [
    //       { type: 'text/plain', value: params.text },
    //       { type: 'text/html', value: params.html },
    //     ],
    //   }),
    // });

    return true;
  } catch (error) {
    console.error('❌ [Sandbox Notification] Error sending email:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled for a user
 */
async function areNotificationsEnabled(
  userId: string,
  notificationType: string
): Promise<boolean> {
  try {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.userId, userId),
          eq(notificationSettings.category, notificationType)
        )
      )
      .limit(1);

    // Default to enabled if no settings found
    return settings?.enabled ?? true;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Send welcome email to a user assigned to a sandbox company
 */
export async function sendUserWelcomeNotification(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Sandbox] Sending welcome notification to user ${userId}`);

    // Check if notifications are enabled
    const notificationsEnabled = await areNotificationsEnabled(
      userId,
      'sandbox_assignment'
    );
    if (!notificationsEnabled) {
      console.log('🔕 [Sandbox] User has disabled sandbox notifications');
      return { success: true }; // Not an error, just skipped
    }

    // Fetch user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch company data
    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, companyId))
      .limit(1);

    if (!company) {
      return { success: false, error: 'Company not found' };
    }

    // Prepare template variables
    const variables: TemplateVariables = {
      userName: user.fullName || user.email?.split('@')[0] || 'User',
      userEmail: user.email || '',
      companyName: company.name,
      companyId: company.id,
      twilioPhoneNumber: company.twilioPhoneNumber || 'Not configured',
      hasTwilioCredentials: company.twilioAccountSid ? '✅ Yes' : '❌ No',
      hasOpenAICredentials: company.openaiApiKey ? '✅ Yes' : '❌ No',
      assignedDate: format(new Date(), 'MMMM dd, yyyy'),
      loginUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      supportUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // Generate email from template
    const template = SANDBOX_TEMPLATES.userWelcome(variables);

    // Send email
    const sent = await sendEmailViaService({
      to: user.email || '',
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'EaseMail <noreply@easemail.ai>',
    });

    if (!sent) {
      return { success: false, error: 'Failed to send email' };
    }

    console.log(`✅ [Sandbox] Welcome notification sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Sandbox] Error sending welcome notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification to admin when a new sandbox company is created
 */
export async function sendAdminCompanyCreatedNotification(
  companyId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `📧 [Sandbox] Sending company created notification to admin ${adminId}`
    );

    // Fetch admin data
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin) {
      return { success: false, error: 'Admin not found' };
    }

    // Fetch company data
    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, companyId))
      .limit(1);

    if (!company) {
      return { success: false, error: 'Company not found' };
    }

    // Prepare template variables
    const variables: TemplateVariables = {
      adminName: admin.fullName || admin.email?.split('@')[0] || 'Admin',
      adminEmail: admin.email || '',
      companyName: company.name,
      companyId: company.id,
      hasTwilioCredentials: company.twilioAccountSid ? '✅ Yes' : '❌ No',
      hasOpenAICredentials: company.openaiApiKey ? '✅ Yes' : '❌ No',
      createdDate: format(company.createdAt, 'MMMM dd, yyyy'),
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // Generate email from template
    const template = SANDBOX_TEMPLATES.adminCompanyCreated(variables);

    // Send email
    const sent = await sendEmailViaService({
      to: admin.email || '',
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'EaseMail Admin <admin@easemail.ai>',
    });

    if (!sent) {
      return { success: false, error: 'Failed to send email' };
    }

    console.log(
      `✅ [Sandbox] Company created notification sent to ${admin.email}`
    );
    return { success: true };
  } catch (error) {
    console.error(
      '❌ [Sandbox] Error sending company created notification:',
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification to admin when a user is assigned to a company
 */
export async function sendAdminUserAssignedNotification(
  userId: string,
  companyId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `📧 [Sandbox] Sending user assigned notification to admin ${adminId}`
    );

    // Fetch admin data
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, adminId))
      .limit(1);

    if (!admin) {
      return { success: false, error: 'Admin not found' };
    }

    // Fetch user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch company data
    const [company] = await db
      .select()
      .from(sandboxCompanies)
      .where(eq(sandboxCompanies.id, companyId))
      .limit(1);

    if (!company) {
      return { success: false, error: 'Company not found' };
    }

    // Prepare template variables
    const variables: TemplateVariables = {
      adminName: admin.fullName || admin.email?.split('@')[0] || 'Admin',
      adminEmail: admin.email || '',
      userName: user.fullName || user.email?.split('@')[0] || 'User',
      userEmail: user.email || '',
      companyName: company.name,
      companyId: company.id,
      assignedDate: format(new Date(), 'MMMM dd, yyyy'),
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // Generate email from template
    const template = SANDBOX_TEMPLATES.adminUserAssigned(variables);

    // Send email
    const sent = await sendEmailViaService({
      to: admin.email || '',
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'EaseMail Admin <admin@easemail.ai>',
    });

    if (!sent) {
      return { success: false, error: 'Failed to send email' };
    }

    console.log(
      `✅ [Sandbox] User assigned notification sent to ${admin.email}`
    );
    return { success: true };
  } catch (error) {
    console.error(
      '❌ [Sandbox] Error sending user assigned notification:',
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification to user when they are removed from a company
 */
export async function sendUserRemovedNotification(
  userId: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📧 [Sandbox] Sending removal notification to user ${userId}`);

    // Fetch user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Prepare template variables
    const variables: TemplateVariables = {
      userName: user.fullName || user.email?.split('@')[0] || 'User',
      userEmail: user.email || '',
      companyName,
      supportUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // Generate email from template
    const template = SANDBOX_TEMPLATES.userRemoved(variables);

    // Send email
    const sent = await sendEmailViaService({
      to: user.email || '',
      subject: template.subject,
      html: template.html,
      text: template.text,
      from: 'EaseMail <noreply@easemail.ai>',
    });

    if (!sent) {
      return { success: false, error: 'Failed to send email' };
    }

    console.log(`✅ [Sandbox] Removal notification sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Sandbox] Error sending removal notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
