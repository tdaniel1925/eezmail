/**
 * Sandbox Company Email Notification Templates
 * Customizable email templates for sandbox-related notifications
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateVariables {
  // User variables
  userName?: string;
  userEmail?: string;

  // Company variables
  companyName?: string;
  companyId?: string;

  // Admin variables
  adminName?: string;
  adminEmail?: string;

  // Credentials
  twilioPhoneNumber?: string;
  hasTwilioCredentials?: boolean;
  hasOpenAICredentials?: boolean;

  // Dates
  assignedDate?: string;
  createdDate?: string;

  // URLs
  loginUrl?: string;
  dashboardUrl?: string;
  supportUrl?: string;

  // Misc
  additionalInfo?: string;
}

/**
 * Replace template variables with actual values
 */
function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, String(value || ''));
  });

  return rendered;
}

/**
 * Template: User assigned to sandbox company (sent to user)
 */
export function getUserWelcomeTemplate(
  variables: TemplateVariables
): EmailTemplate {
  const subject = renderTemplate(
    'Welcome to {{companyName}} - Your EaseMail Sandbox Access',
    variables
  );

  const html = renderTemplate(
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your Sandbox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 Welcome to EaseMail!
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
                Your sandbox environment is ready
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Hi {{userName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Great news! You've been added to <strong>{{companyName}}</strong> sandbox environment. You now have full access to all EaseMail features with unlimited resources.
              </p>
              
              <!-- Features Box -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 18px;">
                  ✨ What's Included
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                  <li style="margin-bottom: 10px;">Unlimited email storage</li>
                  <li style="margin-bottom: 10px;">Unlimited SMS messaging</li>
                  <li style="margin-bottom: 10px;">Unlimited AI features</li>
                  <li style="margin-bottom: 10px;">All premium features enabled</li>
                  <li style="margin-bottom: 0;">No billing or usage limits</li>
                </ul>
              </div>
              
              <!-- Quick Start -->
              <h3 style="margin: 30px 0 15px; color: #111827; font-size: 20px;">
                🚀 Quick Start Guide
              </h3>
              
              <div style="margin-bottom: 15px;">
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                  <strong style="color: #3b82f6;">1. Connect Your Email</strong>
                  <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                    Link your Gmail, Outlook, or IMAP account to start managing emails
                  </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                  <strong style="color: #8b5cf6;">2. Explore AI Features</strong>
                  <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                    Try smart replies, email summaries, and automatic categorization
                  </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                  <strong style="color: #10b981;">3. Test SMS Messaging</strong>
                  <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                    Send SMS messages and voice notes directly from the platform
                  </p>
                </div>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                  <strong style="color: #f59e0b;">4. Set Up Automation</strong>
                  <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                    Create rules to automatically categorize and respond to emails
                  </p>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0 30px;">
                <a href="{{loginUrl}}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                  Access Your Dashboard →
                </a>
              </div>
              
              <!-- Support -->
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin-top: 30px;">
                <h4 style="margin: 0 0 10px; color: #92400e; font-size: 16px;">
                  📚 Need Help?
                </h4>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 20px;">
                  Check out our <a href="{{supportUrl}}/docs" style="color: #92400e; text-decoration: underline;">documentation</a> or 
                  <a href="{{supportUrl}}/support" style="color: #92400e; text-decoration: underline;">contact support</a> if you have any questions.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This is a sandbox environment for <strong>{{companyName}}</strong>
              </p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 EaseMail. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables
  );

  const text = renderTemplate(
    `
Welcome to EaseMail - Your Sandbox Access

Hi {{userName}},

Great news! You've been added to {{companyName}} sandbox environment. You now have full access to all EaseMail features with unlimited resources.

WHAT'S INCLUDED:
• Unlimited email storage
• Unlimited SMS messaging
• Unlimited AI features
• All premium features enabled
• No billing or usage limits

QUICK START GUIDE:

1. Connect Your Email
   Link your Gmail, Outlook, or IMAP account to start managing emails

2. Explore AI Features
   Try smart replies, email summaries, and automatic categorization

3. Test SMS Messaging
   Send SMS messages and voice notes directly from the platform

4. Set Up Automation
   Create rules to automatically categorize and respond to emails

ACCESS YOUR DASHBOARD:
{{loginUrl}}

NEED HELP?
Check out our documentation: {{supportUrl}}/docs
Contact support: {{supportUrl}}/support

This is a sandbox environment for {{companyName}}

© 2025 EaseMail. All rights reserved.
    `,
    variables
  );

  return { subject, html, text };
}

/**
 * Template: New sandbox company created (sent to admin)
 */
export function getAdminCompanyCreatedTemplate(
  variables: TemplateVariables
): EmailTemplate {
  const subject = renderTemplate(
    '[EaseMail Admin] New Sandbox Company Created: {{companyName}}',
    variables
  );

  const html = renderTemplate(
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Sandbox Company</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                🏢 New Sandbox Company Created
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Hi {{adminName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                A new sandbox company has been created and is now active.
              </p>
              
              <!-- Company Details -->
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">
                  Company Details
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                      <strong>Name:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{companyName}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Company ID:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-family: monospace;">
                      {{companyId}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Created Date:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{createdDate}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Twilio Configured:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px;">
                      {{hasTwilioCredentials}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>OpenAI Configured:</strong>
                    </td>
                    <td style="padding: 8px 0; font-size: 14px;">
                      {{hasOpenAICredentials}}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Required -->
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin: 0 0 10px; color: #1e40af; font-size: 16px;">
                  📋 Next Steps
                </h4>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 20px;">
                  You can now assign users to this sandbox company from the admin panel.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}/admin/companies/{{companyId}}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Manage Company →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                EaseMail Admin Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables
  );

  const text = renderTemplate(
    `
NEW SANDBOX COMPANY CREATED

Hi {{adminName}},

A new sandbox company has been created and is now active.

COMPANY DETAILS:
Name: {{companyName}}
Company ID: {{companyId}}
Created Date: {{createdDate}}
Twilio Configured: {{hasTwilioCredentials}}
OpenAI Configured: {{hasOpenAICredentials}}

NEXT STEPS:
You can now assign users to this sandbox company from the admin panel.

MANAGE COMPANY:
{{dashboardUrl}}/admin/companies/{{companyId}}

---
EaseMail Admin Notification
    `,
    variables
  );

  return { subject, html, text };
}

/**
 * Template: User assigned to company (sent to admin)
 */
export function getAdminUserAssignedTemplate(
  variables: TemplateVariables
): EmailTemplate {
  const subject = renderTemplate(
    '[EaseMail Admin] User Assigned to {{companyName}}',
    variables
  );

  const html = renderTemplate(
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Assigned</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #059669; padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ✅ User Assigned to Sandbox
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Hi {{adminName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                A user has been successfully assigned to <strong>{{companyName}}</strong>.
              </p>
              
              <!-- User Details -->
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">
                  User Information
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                      <strong>Name:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{userName}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Email:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{userEmail}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Assigned Date:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{assignedDate}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      <strong>Company:</strong>
                    </td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      {{companyName}}
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  ✉️ The user has been sent a welcome email with access instructions.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}/admin/companies/{{companyId}}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  View Company Dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                EaseMail Admin Notification
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables
  );

  const text = renderTemplate(
    `
USER ASSIGNED TO SANDBOX

Hi {{adminName}},

A user has been successfully assigned to {{companyName}}.

USER INFORMATION:
Name: {{userName}}
Email: {{userEmail}}
Assigned Date: {{assignedDate}}
Company: {{companyName}}

✓ The user has been sent a welcome email with access instructions.

VIEW COMPANY DASHBOARD:
{{dashboardUrl}}/admin/companies/{{companyId}}

---
EaseMail Admin Notification
    `,
    variables
  );

  return { subject, html, text };
}

/**
 * Template: User removed from company (sent to user)
 */
export function getUserRemovedTemplate(
  variables: TemplateVariables
): EmailTemplate {
  const subject = renderTemplate(
    'Your Access to {{companyName}} Sandbox Has Been Removed',
    variables
  );

  const html = renderTemplate(
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Removed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #f59e0b; padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Sandbox Access Updated
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Hi {{userName}},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 24px;">
                Your access to the <strong>{{companyName}}</strong> sandbox environment has been removed by an administrator.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 20px;">
                  If you believe this is an error or have questions, please contact your administrator or our support team.
                </p>
              </div>
              
              <!-- Support -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{supportUrl}}/support" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Contact Support →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 EaseMail. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    variables
  );

  const text = renderTemplate(
    `
SANDBOX ACCESS UPDATED

Hi {{userName}},

Your access to the {{companyName}} sandbox environment has been removed by an administrator.

If you believe this is an error or have questions, please contact your administrator or our support team.

CONTACT SUPPORT:
{{supportUrl}}/support

© 2025 EaseMail. All rights reserved.
    `,
    variables
  );

  return { subject, html, text };
}

export const SANDBOX_TEMPLATES = {
  userWelcome: getUserWelcomeTemplate,
  adminCompanyCreated: getAdminCompanyCreatedTemplate,
  adminUserAssigned: getAdminUserAssignedTemplate,
  userRemoved: getUserRemovedTemplate,
} as const;

export type SandboxTemplateType = keyof typeof SANDBOX_TEMPLATES;
