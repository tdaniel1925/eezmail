-- Create notification template enums
CREATE TYPE notification_template_type AS ENUM ('transactional', 'marketing', 'system', 'sandbox');
CREATE TYPE notification_audience AS ENUM ('all', 'sandbox', 'individual', 'team', 'enterprise', 'admin');
CREATE TYPE notification_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE email_delivery_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked');

-- Create notification_templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL UNIQUE,
  
  -- Template type and audience
  type notification_template_type NOT NULL,
  audience notification_audience NOT NULL DEFAULT 'all',
  status notification_status NOT NULL DEFAULT 'draft',
  
  -- Email content
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  preheader TEXT,
  
  -- Template variables
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Images
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Personalization rules
  personalization_rules JSONB DEFAULT '{}'::jsonb,
  
  -- Sender info
  from_name VARCHAR(100),
  from_email VARCHAR(255),
  reply_to_email VARCHAR(255),
  
  -- Categories and tags
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0 NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for notification_templates
CREATE INDEX notification_templates_type_idx ON notification_templates (type);
CREATE INDEX notification_templates_audience_idx ON notification_templates (audience);
CREATE INDEX notification_templates_status_idx ON notification_templates (status);
CREATE INDEX notification_templates_category_idx ON notification_templates (category);

-- Create notification_queue table
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template and recipient
  template_id UUID NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email details
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Variable substitution data
  variables JSONB DEFAULT '{}'::jsonb,
  
  -- Delivery status
  status email_delivery_status NOT NULL DEFAULT 'pending',
  delivery_attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- External service tracking
  external_id VARCHAR(255),
  external_status TEXT,
  
  -- Error tracking
  error_message TEXT,
  error_code VARCHAR(50),
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for notification_queue
CREATE INDEX notification_queue_template_id_idx ON notification_queue (template_id);
CREATE INDEX notification_queue_recipient_id_idx ON notification_queue (recipient_id);
CREATE INDEX notification_queue_status_idx ON notification_queue (status);
CREATE INDEX notification_queue_scheduled_for_idx ON notification_queue (scheduled_for);
CREATE INDEX notification_queue_sent_at_idx ON notification_queue (sent_at);

-- Create template_images table
CREATE TABLE template_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Image metadata
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  
  -- Storage
  url TEXT NOT NULL,
  storage_key TEXT,
  
  -- Alt text and metadata
  alt_text TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0 NOT NULL,
  used_in_templates JSONB DEFAULT '[]'::jsonb,
  
  -- Upload info
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for template_images
CREATE INDEX template_images_uploaded_by_idx ON template_images (uploaded_by);
CREATE INDEX template_images_filename_idx ON template_images (filename);

-- Insert default notification templates
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
  category
) VALUES
-- Welcome Email (All Users)
(
  'Welcome to EaseMail',
  'Welcome email sent to all new users',
  'welcome-all-users',
  'transactional',
  'all',
  'active',
  'Welcome to EaseMail, {{userName}}!',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;} .header{background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;} .content{background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;} .button{display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;} .footer{background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;}</style></head><body><div class="header"><h1>Welcome to EaseMail!</h1><p>Your journey to effortless email management begins now.</p></div><div class="content"><p>Hi {{userName}},</p><p>Thank you for joining EaseMail! We''re excited to help you take control of your inbox with AI-powered email management.</p><h3>Quick Start Guide:</h3><ul><li><strong>Connect Your Email:</strong> Link your Gmail, Outlook, or IMAP account</li><li><strong>Explore AI Features:</strong> Try AI summaries and smart replies</li><li><strong>Customize Your Workflow:</strong> Set up rules and filters</li></ul><a href="{{dashboardLink}}" class="button">Go to Dashboard</a><p>If you have any questions, our support team is here to help at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p><p>Best regards,<br>The EaseMail Team</p></div><div class="footer"><p>&copy; {{currentYear}} EaseMail. All rights reserved.</p><p>You received this email because you signed up for EaseMail.</p></div></body></html>',
  'Welcome to EaseMail, {{userName}}!\n\nHi {{userName}},\n\nThank you for joining EaseMail! We''re excited to help you take control of your inbox with AI-powered email management.\n\nQuick Start Guide:\n• Connect Your Email: Link your Gmail, Outlook, or IMAP account\n• Explore AI Features: Try AI summaries and smart replies\n• Customize Your Workflow: Set up rules and filters\n\nGo to Dashboard: {{dashboardLink}}\n\nIf you have any questions, our support team is here to help at {{supportEmail}}.\n\nBest regards,\nThe EaseMail Team\n\n© {{currentYear}} EaseMail. All rights reserved.',
  'Your journey to effortless email management begins now',
  '["userName", "dashboardLink", "supportEmail", "currentYear"]'::jsonb,
  'EaseMail',
  'noreply@easemail.ai',
  'onboarding'
),
-- Sandbox User Welcome
(
  'Welcome to EaseMail Sandbox',
  'Welcome email for sandbox users',
  'welcome-sandbox-user',
  'sandbox',
  'sandbox',
  'active',
  'Welcome to {{companyName}} Sandbox, {{userName}}!',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;} .header{background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;} .badge{background: #ffd700; color: #333; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; margin-top: 10px;} .content{background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;} .feature-box{background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #3a7bd5; border-radius: 4px;} .button{display: inline-block; background: #3a7bd5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;} .footer{background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;}</style></head><body><div class="header"><h1>Welcome to the EaseMail Sandbox!</h1><span class="badge">SANDBOX ENVIRONMENT</span><p>Unlimited access to all premium features</p></div><div class="content"><p>Hi {{userName}},</p><p>You''ve been invited to join the <strong>{{companyName}}</strong> sandbox environment! This is a special testing environment where you can explore EaseMail without any limits.</p><div class="feature-box"><h3>🎉 What''s Included:</h3><ul><li>✅ Unlimited Email Storage</li><li>✅ Unlimited SMS Messages</li><li>✅ Unlimited AI Tokens</li><li>✅ All Premium Features</li><li>✅ Voice Message Support</li><li>✅ Advanced Analytics</li></ul></div><h3>Quick Start Guide:</h3><ol><li><strong>Connect Your Email:</strong> Go to Settings → Email Accounts</li><li><strong>Explore AI Features:</strong> Try AI summaries, smart replies, and categorization</li><li><strong>Test SMS Messaging:</strong> Send SMS and voice messages directly from the platform</li></ol><a href="{{loginLink}}" class="button">Log In to Your Sandbox</a><p>If you have any questions, contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p><p>Happy exploring!<br>The EaseMail Team</p></div><div class="footer"><p>&copy; {{currentYear}} EaseMail. All rights reserved.</p></div></body></html>',
  'Welcome to {{companyName}} Sandbox, {{userName}}!\n\nHi {{userName}},\n\nYou''ve been invited to join the {{companyName}} sandbox environment! This is a special testing environment where you can explore EaseMail without any limits.\n\nWhat''s Included:\n• Unlimited Email Storage\n• Unlimited SMS Messages\n• Unlimited AI Tokens\n• All Premium Features\n• Voice Message Support\n• Advanced Analytics\n\nQuick Start Guide:\n1. Connect Your Email: Go to Settings → Email Accounts\n2. Explore AI Features: Try AI summaries, smart replies, and categorization\n3. Test SMS Messaging: Send SMS and voice messages directly from the platform\n\nLog In to Your Sandbox: {{loginLink}}\n\nIf you have any questions, contact us at {{supportEmail}}.\n\nHappy exploring!\nThe EaseMail Team\n\n© {{currentYear}} EaseMail. All rights reserved.',
  'Unlimited access to all premium features awaits!',
  '["userName", "companyName", "loginLink", "supportEmail", "currentYear"]'::jsonb,
  'EaseMail',
  'noreply@easemail.ai',
  'sandbox'
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_images TO authenticated;

COMMENT ON TABLE notification_templates IS 'Email notification templates with HTML support and personalization';
COMMENT ON TABLE notification_queue IS 'Queue for tracking email delivery status and scheduling';
COMMENT ON TABLE template_images IS 'Images used in email templates with usage tracking';

