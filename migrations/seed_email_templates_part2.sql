-- ============================================================================
-- EMAIL TEMPLATES SEED DATA - PART 2: Password Reset & Security
-- ============================================================================

-- 2. PASSWORD RESET
INSERT INTO notification_templates (
  id, name, description, slug, type, audience, status, subject,
  html_content, text_content, preheader, variables,
  from_name, from_email, category, tags
) VALUES (
  gen_random_uuid(),
  'Password Reset Request',
  'Email sent when user requests password reset',
  'password-reset',
  'transactional',
  'all',
  'active',
  'Reset Your EaseMail Password',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #4ca1af 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0; text-align: center;">EaseMail</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #333333;">Password Reset Request 🔐</h1>
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666666;">Hi {{userName}},</p>
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666666;">We received a request to reset your password for your EaseMail account.</p>
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{resetLink}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #4ca1af 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Security Note:</strong> This link expires in {{expiryTime}}.</p>
                            </div>
                            <p style="margin: 20px 0 0 0; font-size: 14px; color: #999999;">Request made from: {{requestIp}} ({{requestLocation}})</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #999999;">If you didn''t request this, please ignore this email or contact support if you have concerns.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; text-align: center; font-size: 14px; color: #999999;">© {{currentYear}} EaseMail. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
  'Password Reset Request

Hi {{userName}},

We received a request to reset your password for your EaseMail account.

Reset your password: {{resetLink}}

⚠️ Security Note: This link expires in {{expiryTime}}.

Request made from: {{requestIp}} ({{requestLocation}})

If you didn''t request this, please ignore this email or contact support.

© {{currentYear}} EaseMail.',
  'Reset your EaseMail password securely',
  '["userName", "userEmail", "resetLink", "expiryTime", "requestIp", "requestLocation", "currentYear"]',
  'EaseMail Security',
  'security@easemail.ai',
  'security',
  '["password-reset", "security"]'
);

-- 3. EMAIL VERIFICATION
INSERT INTO notification_templates (
  id, name, description, slug, type, audience, status, subject,
  html_content, text_content, preheader, variables,
  from_name, from_email, category, tags
) VALUES (
  gen_random_uuid(),
  'Verify Your Email',
  'Email verification code sent to new users',
  'email-verification',
  'transactional',
  'all',
  'active',
  'Verify Your EaseMail Email Address',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #4ca1af 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; font-size: 36px; margin: 0; text-align: center;">EaseMail</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h1 style="margin: 0 0 20px 0; font-size: 28px; color: #333333;">Verify Your Email ✉️</h1>
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666666;">Hi {{userName}},</p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Please verify your email address using the code below:</p>
                            <div style="background-color: #f8f9fa; border: 2px dashed #4ca1af; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-transform: uppercase;">Verification Code</p>
                                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px;">{{verificationCode}}</p>
                            </div>
                            <p style="margin: 20px 0 0 0; font-size: 14px; color: #999999;">This code expires in {{expiryTime}}.</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #999999;">Or click here: <a href="{{verificationLink}}" style="color: #4ca1af;">Verify Email</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; text-align: center; font-size: 14px; color: #999999;">© {{currentYear}} EaseMail. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>',
  'Verify Your Email

Hi {{userName}},

Please verify your email address using this code:

{{verificationCode}}

This code expires in {{expiryTime}}.

Or click here: {{verificationLink}}

© {{currentYear}} EaseMail.',
  'Verify your email to get started with EaseMail',
  '["userName", "userEmail", "verificationCode", "verificationLink", "expiryTime", "currentYear"]',
  'EaseMail',
  'noreply@easemail.ai',
  'onboarding',
  '["verification", "onboarding"]'
);

-- Continue in next part...

