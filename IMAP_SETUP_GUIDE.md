# IMAP Email Integration Setup

## Quick Setup for Microsoft Outlook

### Step 1: Enable IMAP in Outlook

1. Go to Outlook.com → Settings → Mail → Sync email
2. Enable "IMAP access"
3. Generate an App Password:
   - Go to Security → Advanced security options
   - Create an App Password for "Mail"

### Step 2: Configure IMAP Settings

- **Server**: outlook.office365.com
- **Port**: 993 (SSL)
- **Username**: your-email@outlook.com
- **Password**: App Password (not your regular password)

### Step 3: Test Connection

Use these settings in your email client to test the connection.

## Benefits of IMAP

- ✅ Works immediately
- ✅ No OAuth complexity
- ✅ Universal compatibility
- ✅ No third-party dependencies
- ✅ Full email access

## Security Note

App passwords are secure and can be revoked anytime. This is actually more secure than storing OAuth tokens in some cases.
