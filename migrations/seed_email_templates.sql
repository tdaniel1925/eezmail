-- ============================================================================
-- EaseMail Notification Templates - Complete Seed Data
-- ============================================================================
-- This migration inserts production-ready email templates for all system notifications
-- Run this after: migrations/create_notification_templates.sql
-- ============================================================================

-- 1. WELCOME EMAIL - ALL USERS
INSERT INTO notification_templates (
  id,
  name,
  description,
  slug,
  type,
  audience,
  status,
  subject,
  html_content,
  text_content,
  preheader,
  variables,
  from_name,
  from_email,
  category,
  tags
) VALUES (
  gen_random_uuid(),
  'Welcome to EaseMail - All Users',
  'Welcome email sent to all new users after account creation',
  'welcome-all-users',
  'transactional',
  'all',
  'active',
  'Welcome to EaseMail! 🎉',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EaseMail - Account Confirmed!</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #4ca1af 100%); border-radius: 8px 8px 0 0;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                                <tr>
                                    <td align="center">
                                        <h1 style="color: #ffffff; font-size: 36px; margin: 0;">EaseMail</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <h1 style="margin: 0 0 20px 0; font-size: 32px; font-weight: 600; color: #333333;">Welcome to EaseMail! 🎉</h1>
                                        <p style="margin: 0 0 30px 0; font-size: 18px; line-height: 1.6; color: #666666;">
                                            Your account has been successfully created and confirmed.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background-color: #e8f5e9; border: 2px solid #4caf50; border-radius: 50px; padding: 15px 30px;">
                                            <span style="color: #2e7d32; font-size: 16px; font-weight: 600;">✓ Email Verified</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                            Hi {{userName}}!
                                        </p>
                                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #666666;">
                                            Thank you for choosing EaseMail! We''re thrilled to have you on board. Your email management journey just got a whole lot easier.
                                        </p>
                                        <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #666666;">
                                            With EaseMail, you can now enjoy:
                                        </p>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; margin-bottom: 30px;">
                                            <tr>
                                                <td style="padding: 0 0 15px 0;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="width: 30px; vertical-align: top;">
                                                                <span style="color: #4ca1af; font-size: 20px;">✉️</span>
                                                            </td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 15px; color: #666666;">
                                                                    <strong style="color: #333333;">Unified Inbox</strong> - Manage all your email accounts in one place
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 15px 0;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="width: 30px; vertical-align: top;">
                                                                <span style="color: #4ca1af; font-size: 20px;">🤖</span>
                                                            </td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 15px; color: #666666;">
                                                                    <strong style="color: #333333;">AI-Powered Features</strong> - Smart compose, auto-replies, and intelligent sorting
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 15px 0;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="width: 30px; vertical-align: top;">
                                                                <span style="color: #4ca1af; font-size: 20px;">🔒</span>
                                                            </td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 15px; color: #666666;">
                                                                    <strong style="color: #333333;">Advanced Security</strong> - End-to-end encryption and privacy protection
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 15px 0;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="width: 30px; vertical-align: top;">
                                                                <span style="color: #4ca1af; font-size: 20px;">📊</span>
                                                            </td>
                                                            <td style="padding-left: 10px;">
                                                                <p style="margin: 0; font-size: 15px; color: #666666;">
                                                                    <strong style="color: #333333;">Analytics Dashboard</strong> - Track your email productivity and patterns
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; margin-bottom: 30px;">
                                            <tr>
                                                <td align="center">
                                                    <a href="{{dashboardLink}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #4ca1af 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                                        Get Started with EaseMail
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                                            <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333333;">Quick Start Guide:</h2>
                                            <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 15px; line-height: 1.8;">
                                                <li style="margin-bottom: 8px;">Connect your email accounts (Gmail, Outlook, Yahoo, etc.)</li>
                                                <li style="margin-bottom: 8px;">Customize your inbox layout and preferences</li>
                                                <li style="margin-bottom: 8px;">Set up AI assistants for smart email management</li>
                                                <li style="margin-bottom: 8px;">Explore advanced features in the settings panel</li>
                                            </ol>
                                        </div>
                                        <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333;">
                                            <strong>Need Help?</strong>
                                        </p>
                                        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #666666;">
                                            Our support team is here for you! Check out our <a href="{{helpCenterLink}}" style="color: #4ca1af; text-decoration: none;">Help Center</a> or reply to this email with any questions.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #999999;">
                                            © {{currentYear}} EaseMail. All rights reserved.
                                        </p>
                                        <p style="margin: 0; font-size: 13px; color: #999999;">
                                            <a href="{{privacyPolicyLink}}" style="color: #999999; text-decoration: none;">Privacy Policy</a> | 
                                            <a href="{{termsOfServiceLink}}" style="color: #999999; text-decoration: none;">Terms of Service</a> | 
                                            <a href="{{unsubscribeLink}}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
  'Welcome to EaseMail!

Hi {{userName}}!

Your account has been successfully created and confirmed.

Thank you for choosing EaseMail! We''re thrilled to have you on board.

With EaseMail, you can now enjoy:
• Unified Inbox - Manage all your email accounts in one place
• AI-Powered Features - Smart compose, auto-replies, and intelligent sorting
• Advanced Security - End-to-end encryption and privacy protection
• Analytics Dashboard - Track your email productivity and patterns

Get started: {{dashboardLink}}

Quick Start Guide:
1. Connect your email accounts (Gmail, Outlook, Yahoo, etc.)
2. Customize your inbox layout and preferences
3. Set up AI assistants for smart email management
4. Explore advanced features in the settings panel

Need Help?
Visit our Help Center: {{helpCenterLink}}
Or reply to this email with any questions.

© {{currentYear}} EaseMail. All rights reserved.
Privacy Policy: {{privacyPolicyLink}}
Terms of Service: {{termsOfServiceLink}}
Unsubscribe: {{unsubscribeLink}}',
  'Your EaseMail account is ready! Start managing your emails smarter.',
  '["userName", "userEmail", "dashboardLink", "helpCenterLink", "privacyPolicyLink", "termsOfServiceLink", "unsubscribeLink", "currentYear"]',
  'EaseMail',
  'welcome@easemail.ai',
  'onboarding',
  '["welcome", "onboarding", "account-creation"]'
);

-- Continue in next file due to length...

