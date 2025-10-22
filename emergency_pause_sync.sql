-- EMERGENCY: Pause sync to stop rate limit hits
UPDATE email_accounts 
SET 
  status = 'error',
  error_message = 'Temporarily paused - Fastmail rate limit hit. Please wait 10 minutes and update password.'
WHERE email_address = 'tdaniel@botmakers.ai';



