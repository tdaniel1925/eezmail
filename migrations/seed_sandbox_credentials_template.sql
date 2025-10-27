-- ============================================================================
-- SANDBOX USER CREDENTIALS EMAIL TEMPLATE
-- ============================================================================
-- Add this template to the notification_templates table
-- This template is sent when a sandbox user is created with auto-generated credentials
-- ============================================================================

INSERT INTO notification_templates (
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
  'Sandbox User Credentials',
  'Email sent to sandbox users with their auto-generated login credentials',
  'sandbox-user-credentials',
  'transactional',
  'sandbox_users',
  'active',
  'Your EaseMail Sandbox Account - Login Credentials',
  
  -- HTML Content
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Sandbox Account</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #FF4C5A 0%, #FF6B7A 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 32px; font-weight: bold; color: #ffffff; margin: 0; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 0 0 20px 0; }
    .text { font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0; }
    .credentials-box { background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0; }
    .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #dee2e6; }
    .credential-row:last-child { border-bottom: none; }
    .credential-label { font-size: 14px; font-weight: 600; color: #6c757d; }
    .credential-value { font-size: 18px; font-weight: bold; color: #1a1a1a; font-family: "Courier New", monospace; }
    .button { display: inline-block; padding: 16px 32px; background-color: #FF4C5A; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button:hover { background-color: #ff3647; }
    .warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .warning-text { font-size: 14px; color: #856404; margin: 0; }
    .steps { margin: 30px 0; }
    .step { display: flex; margin-bottom: 20px; }
    .step-number { flex-shrink: 0; width: 32px; height: 32px; background-color: #FF4C5A; color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; }
    .step-content { flex: 1; }
    .step-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 5px 0; }
    .step-description { font-size: 14px; color: #6c757d; margin: 0; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { font-size: 14px; color: #6c757d; margin: 0 0 10px 0; }
    .footer-link { color: #FF4C5A; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo">EaseMail</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h1 class="title">🎉 Your Sandbox Account is Ready!</h1>
      
      <p class="text">
        Hi {{full_name}},
      </p>
      
      <p class="text">
        Your EaseMail sandbox account has been created. Below are your login credentials. 
        Please save them in a secure location.
      </p>

      <!-- Credentials Box -->
      <div class="credentials-box">
        <div class="credential-row">
          <span class="credential-label">Username</span>
          <span class="credential-value">{{username}}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">{{temporary_password}}</span>
        </div>
      </div>

      <!-- Warning Box -->
      <div class="warning-box">
        <p class="warning-text">
          <strong>⚠️ Important:</strong> Please change your password immediately after your first login for security purposes.
        </p>
      </div>

      <!-- Login Button -->
      <div style="text-align: center;">
        <a href="{{login_url}}" class="button">Login to Your Account</a>
      </div>

      <!-- Getting Started Steps -->
      <div class="steps">
        <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 20px 0;">
          Getting Started
        </h2>

        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3 class="step-title">Login to EaseMail</h3>
            <p class="step-description">
              Use your username and temporary password to access your account.
            </p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3 class="step-title">Change Your Password</h3>
            <p class="step-description">
              Go to Settings → Profile and update your password to something secure and memorable.
            </p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3 class="step-title">Explore the Platform</h3>
            <p class="step-description">
              Start exploring EaseMail''s features and tools in your sandbox environment.
            </p>
          </div>
        </div>
      </div>

      <p class="text">
        If you have any questions or need assistance, our support team is here to help!
      </p>

      <p class="text" style="margin-top: 40px;">
        Best regards,<br>
        <strong>The EaseMail Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This is an automated message from EaseMail. Please do not reply to this email.
      </p>
      <p class="footer-text">
        <a href="https://easemail.app/help" class="footer-link">Help Center</a> •
        <a href="https://easemail.app/privacy" class="footer-link">Privacy Policy</a> •
        <a href="https://easemail.app/terms" class="footer-link">Terms of Service</a>
      </p>
      <p class="footer-text">
        © 2024 EaseMail. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>',

  -- Text Content (plain text fallback)
  'Hi {{full_name}},

Your EaseMail sandbox account has been created!

LOGIN CREDENTIALS:
-------------------
Username: {{username}}
Temporary Password: {{temporary_password}}

⚠️ IMPORTANT: Please change your password immediately after your first login.

Login here: {{login_url}}

GETTING STARTED:
1. Login to EaseMail using your credentials
2. Go to Settings → Profile and change your password
3. Start exploring the platform

If you have any questions, contact our support team.

Best regards,
The EaseMail Team

---
This is an automated message from EaseMail.
Help Center: https://easemail.app/help
Privacy: https://easemail.app/privacy',

  -- Preheader
  'Your login credentials for EaseMail sandbox',

  -- Variables (JSON array)
  jsonb_build_array(
    'username',
    'temporary_password',
    'login_url',
    'full_name'
  ),

  -- From details
  'EaseMail Team',
  'noreply@easemail.app',

  -- Category and tags
  'onboarding',
  ARRAY['sandbox', 'credentials', 'onboarding', 'security']::text[]
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  html_content = EXCLUDED.html_content,
  text_content = EXCLUDED.text_content,
  subject = EXCLUDED.subject,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the template was created:
-- SELECT slug, name, status, array_length(variables, 1) as variable_count 
-- FROM notification_templates 
-- WHERE slug = 'sandbox-user-credentials';

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================
-- To send this email, use the notification service:
/*
await sendNotificationEmail({
  templateSlug: 'sandbox-user-credentials',
  to: 'user@example.com',
  variables: {
    username: 'johndoe_1234',
    temporary_password: 'TempPass123!@#$%',
    login_url: 'https://easemail.app/login',
    full_name: 'John Doe'
  }
});
*/

