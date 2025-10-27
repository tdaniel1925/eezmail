-- Mark onboarding as completed for tdaniel1925@easemail.com
UPDATE onboarding_progress
SET 
  onboarding_completed = true,
  onboarding_step = 'complete',
  email_connected = true,
  folders_configured = true,
  profile_completed = true,
  updated_at = NOW()
WHERE user_id = '22d96fcc-8173-42bc-b3e7-15458024a47d';
