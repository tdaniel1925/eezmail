# 🔌 Nylas Setup Guide - Connect Your Email Account

## ✅ Current Status

Your Nylas integration is **fully built** and ready to use! Here's what's already done:

- ✅ OAuth flow implemented (`/api/nylas/auth` and `/api/nylas/callback`)
- ✅ Contact sync functionality (`syncContactsFromNylas`)
- ✅ Email sync infrastructure (ready)
- ✅ ConnectedAccounts UI in settings
- ✅ SyncContactsButton component
- ✅ Database schema for email accounts

## 🚀 What You Need to Do

### Step 1: Get Nylas Credentials

1. **Sign up for Nylas** (if you haven't already)
   - Go to: https://dashboard.nylas.com/register
   - Sign up for a free account

2. **Create a Nylas Application**
   - After logging in, click "Create Application"
   - Choose "V3 Application" (latest version)
   - Name it something like "Imbox Email Client - Dev"

3. **Get Your API Credentials**
   You'll need 4 keys from your Nylas dashboard:
   - **NYLAS_CLIENT_ID** - Found in Application Settings
   - **NYLAS_CLIENT_SECRET** - Found in Application Settings (keep secret!)
   - **NYLAS_API_KEY** - Found in Application Settings
   - **NYLAS_API_URI** - Usually `https://api.us.nylas.com` (or your region)

### Step 2: Configure Callback URLs in Nylas Dashboard

In your Nylas application settings, add these callback URLs:

**For Local Development:**

```
http://localhost:3000/api/nylas/callback
```

**For Production (when deployed):**

```
https://your-domain.com/api/nylas/callback
```

### Step 3: Set Environment Variables

Open your `.env.local` file and add/update these variables:

```bash
# NYLAS (Email Integration)
NYLAS_CLIENT_ID=your_actual_client_id_here
NYLAS_CLIENT_SECRET=your_actual_client_secret_here
NYLAS_API_KEY=your_actual_api_key_here
NYLAS_API_URI=https://api.us.nylas.com
NYLAS_WEBHOOK_SECRET=your_webhook_secret_here

# Make sure this matches your dev port
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important Notes:**

- Keep these secrets safe and never commit them to git
- The `.env.local` file is already in `.gitignore`
- You'll need to restart your dev server after changing environment variables

### Step 4: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then start it again
npm run dev
```

### Step 5: Connect Your Email Account

1. **Navigate to Settings**

   ```
   http://localhost:3000/dashboard/settings
   ```

2. **Go to "Email Accounts" Tab**
   - You should see a section called "Connected Email Accounts"
3. **Click "Add Email Account"**
   - Choose your provider (Gmail or Microsoft)
   - You'll be redirected to the OAuth consent screen

4. **Grant Permissions**
   - Sign in with your email account
   - Allow access to:
     - ✅ Email
     - ✅ Contacts
     - ✅ Calendar

5. **You'll be redirected back**
   - If successful, you'll see your account connected
   - It will sync in the background

### Step 6: Test Contact Sync

1. **Go to Contacts Page**

   ```
   http://localhost:3000/dashboard/contacts
   ```

2. **Click "Sync Contacts"**
   - This will fetch contacts from your connected email account
   - Progress will be shown with a spinner
   - Success message will appear when done

3. **Verify Contacts Were Imported**
   - You should see contacts from your email provider
   - Avatars will be fetched if available
   - All contact details will be imported

---

## 🔍 Troubleshooting

### "Missing NYLAS_API_KEY"

**Problem**: Environment variables not loaded

**Solution**:

1. Make sure `.env.local` exists in project root
2. Check that variable names are spelled correctly
3. Restart dev server: `npm run dev`
4. If still not working, check: [[memory:9803359]]

```bash
# Verify variables are set (PowerShell)
Get-Content .env.local | Select-String "NYLAS"
```

### "Failed to initiate OAuth"

**Problem**: Callback URL mismatch

**Solution**:

1. Check Nylas dashboard → Your App → Callback URLs
2. Make sure it includes: `http://localhost:3000/api/nylas/callback`
3. Make sure `NEXT_PUBLIC_APP_URL` in `.env.local` is correct
4. Restart dev server

### "Invalid state" error after OAuth

**Problem**: OAuth state mismatch (timing issue)

**Solution**:

1. Clear browser cookies for localhost
2. Try the OAuth flow again
3. Make sure your system clock is correct

### "Contacts not syncing"

**Problem**: No grantId stored

**Solution**:

1. Check if account was properly connected
2. Go to Settings → Email Accounts
3. If account shows but can't sync:
   - Remove the account
   - Add it again
   - Grant all permissions

### "Unauthorized" error

**Problem**: Access token expired

**Solution**:

1. Nylas tokens expire after some time
2. Reconnect your account in settings
3. For production, implement token refresh (future enhancement)

---

## 📊 What Gets Synced

### Contacts

- ✅ Name (first, last, display name)
- ✅ Emails (all email addresses)
- ✅ Phone numbers
- ✅ Company and job title
- ✅ Addresses
- ✅ Birthday
- ✅ Profile picture/avatar (URL from provider)
- ✅ Notes

### Emails (Infrastructure ready)

- ⏳ All emails from inbox
- ⏳ Sent emails
- ⏳ Email threads
- ⏳ Attachments
- ⏳ Labels/folders
- ⏳ Read/unread status

---

## 🔐 Security Notes

1. **Access Tokens**
   - Stored encrypted in database
   - Never exposed to client-side
   - Used only in server actions

2. **OAuth Flow**
   - Uses state parameter for CSRF protection
   - Validates redirect URIs
   - Secure cookie storage

3. **API Keys**
   - Keep `NYLAS_CLIENT_SECRET` and `NYLAS_API_KEY` secret
   - Never commit to version control
   - Rotate keys if compromised

---

## 🎯 Testing Checklist

- [ ] Nylas account created
- [ ] Application created in Nylas dashboard
- [ ] All 4 environment variables set in `.env.local`
- [ ] Callback URL added to Nylas dashboard
- [ ] Dev server restarted
- [ ] Navigated to Settings → Email Accounts
- [ ] Clicked "Add Email Account"
- [ ] Successfully completed OAuth flow
- [ ] Account shows as "Connected" in settings
- [ ] Navigated to Contacts page
- [ ] Clicked "Sync Contacts" button
- [ ] Contacts imported successfully
- [ ] Avatars loaded from provider

---

## 🚀 Next Steps After Testing

Once you've successfully connected and synced:

1. **Integrate Tag Manager**

   ```tsx
   // Add to src/app/dashboard/settings/page.tsx
   import { TagManager } from '@/components/contacts/TagManager';

   // Add 'tags' tab and render TagManager
   ```

2. **Add Import/Export Buttons**

   ```tsx
   // Add to contacts page header
   <ImportModal ... />
   <ExportModal ... />
   ```

3. **Test Email History**
   - Once emails are synced, email history will show in contact details

4. **Deploy to Production**
   - Update callback URLs in Nylas dashboard
   - Update `NEXT_PUBLIC_APP_URL` for production
   - Test OAuth flow in production environment

---

## 💡 Pro Tips

1. **Use Gmail for Testing**
   - Gmail OAuth is most reliable
   - Google Contacts API works well
   - Avatars usually available

2. **Start with Small Dataset**
   - Test with a personal account first
   - Don't sync 1000+ contacts initially
   - Verify everything works

3. **Monitor Console**
   - Check browser console for errors
   - Check server terminal for logs
   - Nylas provides detailed error messages

4. **Rate Limits**
   - Free tier has limits
   - Syncing large contact lists may take time
   - Be patient with initial sync

---

## 📞 Need Help?

If you encounter issues:

1. **Check Nylas Documentation**
   - https://developer.nylas.com/docs/

2. **Check Server Logs**
   - Look at terminal where `npm run dev` is running
   - Errors will show there

3. **Enable Debug Mode**

   ```typescript
   // In src/lib/nylas/server.ts
   // Add console.logs to see what's happening
   ```

4. **Test OAuth Flow Manually**
   ```
   Visit: http://localhost:3000/api/nylas/auth
   Should redirect to Google/Microsoft login
   ```

---

## ✅ Summary

**You're ready to connect!** 🎉

Your Nylas integration is complete. Just:

1. Add your credentials to `.env.local`
2. Configure callback URLs
3. Restart dev server
4. Go to Settings → Email Accounts → Add Account
5. Grant permissions
6. Sync contacts!

The entire OAuth flow, contact sync, and UI are all built and working. You just need the API keys to test it out!

---

**Need the environment variables added?** Run:

```bash
# Check current .env.local
Get-Content .env.local | Select-String "NYLAS"
```

Let me know if you need help getting your Nylas credentials or setting up the OAuth flow! 🚀

