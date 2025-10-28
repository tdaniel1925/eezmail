# Nylas Setup Guide - The RIGHT Way

**Goal:** Avoid the configuration hell from last time by doing everything in the correct order.

---

## 🎯 Why This Time Will Be Different

**Last time's problems:**
- ❌ Configured things in wrong order
- ❌ Microsoft connector in Nylas Dashboard was empty
- ❌ Unclear which credentials went where
- ❌ Poor error messages

**This time:**
- ✅ Clear step-by-step order
- ✅ Validation script catches issues early
- ✅ Configuration checklist for each platform
- ✅ Automatic testing at each step

---

## 📋 Prerequisites

Before starting, have these ready:
- [ ] Nylas account (sign up at https://dashboard.nylas.com)
- [ ] Azure account (for Microsoft OAuth)
- [ ] Access to your `.env.local` file
- [ ] 30 minutes of focused time

---

## 🚀 Step-by-Step Setup (DO IN THIS ORDER!)

### Step 1: Get Nylas Credentials First

**Why first?** We need these to configure Azure redirect URIs correctly.

1. **Go to Nylas Dashboard:**
   - Visit: https://dashboard.nylas.com
   - Sign in or create account

2. **Create Application (if new):**
   - Click "Applications" → "Create Application"
   - Name: "Imbox Email Client"
   - Click "Create"

3. **Get Your API Credentials:**
   - Go to your application
   - Navigate to "API Keys" or "Application Settings"
   - **Copy these values:**
     - ✅ **Application ID** (your Client ID)
     - ✅ **API Key** (starts with `nylas_`)
     - ✅ **Client Secret** (for token exchange)
     - ✅ **API Region** (US or EU)

4. **Get Your Callback URL:**
   - In Nylas Dashboard, find **OAuth Callback URL**
   - Should be: `https://api.us.nylas.com/v3/connect/callback` (or .eu)
   - **Write this down** - you'll need it for Azure!

5. **Add Your App's Callback URI:**
   - In Nylas Dashboard → Your App → Settings
   - Add **Redirect URI**: 
     - Dev: `http://localhost:3000/api/nylas/callback`
     - Prod: `https://yourdomain.com/api/nylas/callback`
   - Click "Save"

---

### Step 2: Configure Azure App Registration

**Why second?** Now you have Nylas callback URL to add to Azure.

1. **Go to Azure Portal:**
   - Visit: https://portal.azure.com
   - Navigate to: **Azure Active Directory** → **App registrations**

2. **Create New App Registration:**
   ```
   Name: Imbox Email Client (Nylas)
   
   Supported account types:
   "Accounts in any organizational directory and personal Microsoft accounts"
   
   Redirect URI: (Add these NOW)
   ```

3. **Add BOTH Redirect URIs:**
   - Platform: **Web**
   - URI 1: `https://api.us.nylas.com/v3/connect/callback` (Nylas callback)
   - URI 2: `http://localhost:3000/api/nylas/callback` (your app callback)
   - Click "Register"

4. **Copy These Values (you'll need them):**
   - ✅ **Application (client) ID**
   - ✅ **Directory (tenant) ID** (use "common" for multi-tenant)

5. **Create Client Secret:**
   - Go to: **Certificates & secrets** → **Client secrets** → "New client secret"
   - Description: "Nylas Integration"
   - Expires: 24 months
   - Click "Add"
   - ⚠️  **CRITICAL:** Copy the **Value** immediately (not Secret ID)
   - **You cannot see this again!**

6. **Add API Permissions:**
   - Go to: **API permissions** → "Add a permission"
   - Choose: **Microsoft Graph** → **Delegated permissions**
   - Add these permissions:
     - ✅ `Mail.ReadWrite`
     - ✅ `Mail.Send`
     - ✅ `Calendars.ReadWrite`
     - ✅ `Contacts.ReadWrite`
     - ✅ `offline_access`
     - ✅ `User.Read`
   - Click "Add permissions"

7. **Grant Admin Consent (if needed):**
   - If using work account: Click "Grant admin consent for [Your Organization]"
   - Wait 2-3 minutes for propagation

---

### Step 3: Configure Nylas Microsoft Provider

**⚠️  THIS IS THE STEP THAT WAS MISSING LAST TIME!**

**Why third?** Now you have Azure credentials to put in Nylas.

1. **Go to Nylas Dashboard:**
   - Navigate to: **Applications** → Your App → **Integrations**

2. **Find Microsoft Provider:**
   - Look for "Microsoft" in the provider list
   - Click "Configure" or "Edit"

3. **⚠️  CRITICAL - Fill in Microsoft Settings:**

   ```
   Client ID: <Your Azure App Client ID from Step 2.4>
   Client Secret: <Your Azure App Client Secret from Step 2.5>
   Tenant ID: common (or your specific tenant ID from Step 2.4)
   ```

   **Double-check these are correct!**

4. **Verify Configuration:**
   - The settings panel should now show your credentials
   - **NOT empty like last time!**
   - Click "Save"

5. **Test Connection (Optional but Recommended):**
   - Some Nylas plans have a "Test Connection" button
   - If available, click it and complete OAuth flow
   - This validates your Azure app is configured correctly

---

### Step 4: Add Environment Variables

**Why fourth?** Now you have all the credentials needed.

1. **Open your `.env.local` file**

2. **Add these lines:**

   ```env
   # Nylas Configuration
   NYLAS_API_KEY=nylas_<your_api_key_from_step_1>
   NYLAS_API_URI=https://api.us.nylas.com  # or .eu.nylas.com
   NYLAS_CLIENT_ID=<your_nylas_client_id_from_step_1>
   NYLAS_CLIENT_SECRET=<your_nylas_client_secret_from_step_1>
   
   # Azure App (for reference, Nylas handles this internally now)
   AZURE_CLIENT_ID=<your_azure_client_id_from_step_2>
   AZURE_CLIENT_SECRET=<your_azure_client_secret_from_step_2>
   AZURE_TENANT_ID=common
   
   # Your App URL (already exists, verify it's correct)
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://yourdomain.com
   ```

3. **⚠️  Important:**
   - No extra spaces
   - No quotes around values
   - API Key starts with `nylas_`
   - No trailing slashes on URLs

---

### Step 5: Validate Configuration

**Why fifth?** Catch errors before trying to connect.

1. **Run the validation script:**

   ```bash
   npm install --save-dev tsx
   npm run setup:nylas
   ```

   Or manually:

   ```bash
   npx tsx scripts/setup-nylas.ts
   ```

2. **Check the output:**
   - ✅ All environment variables pass
   - ✅ No failed checks
   - ✅ Review Azure checklist
   - ✅ Review Nylas Dashboard checklist

3. **Fix any issues:**
   - Script will tell you exactly what's wrong
   - Fix and run again

4. **Review the report:**
   - Check `nylas-setup-report.json`
   - Verify all URLs match

---

### Step 6: Install Nylas SDK

1. **Install the package:**

   ```bash
   npm install nylas@latest
   ```

2. **Verify installation:**

   ```bash
   npm list nylas
   ```

   Should show `nylas@7.x.x` or later

---

### Step 7: Create Nylas Client

Create a server-side Nylas client:

```typescript
// src/lib/nylas/client.ts
import Nylas from 'nylas';

if (!process.env.NYLAS_API_KEY) {
  throw new Error('NYLAS_API_KEY is required');
}

if (!process.env.NYLAS_API_URI) {
  throw new Error('NYLAS_API_URI is required');
}

export const nylasClient = new Nylas({
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI,
});

// Helper to get authenticated client for a specific grant
export function getNylasClient(grantId: string) {
  return {
    ...nylasClient,
    grantId, // Nylas SDK uses this for authenticated requests
  };
}
```

---

### Step 8: Create OAuth Routes

**Initiate route** (`src/app/api/nylas/auth/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { nylasClient } from '@/lib/nylas/client';

export async function GET(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider') || 'microsoft';
    
    const authUrl = nylasClient.auth.urlForOAuth2({
      clientId: process.env.NYLAS_CLIENT_ID!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/nylas/callback`,
      provider: provider as any,
      scopes: ['email.read_only', 'email.send', 'calendar.read_only'],
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('❌ Nylas OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}
```

**Callback route** (`src/app/api/nylas/callback/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { nylasClient } from '@/lib/nylas/client';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
      );
    }

    // Exchange code for grant
    const response = await nylasClient.auth.exchangeCodeForToken({
      clientId: process.env.NYLAS_CLIENT_ID!,
      clientSecret: process.env.NYLAS_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/nylas/callback`,
      code,
    });

    // Get user info
    const user = await nylasClient.auth.currentUser();
    
    // Save to database
    await db.insert(emailAccounts).values({
      userId: user.id, // Get from your auth system
      provider: 'microsoft',
      emailAddress: response.email,
      nylasGrantId: response.grantId,
      accessToken: response.accessToken, // Encrypted in production
      refreshToken: response.refreshToken, // Encrypted in production
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=account_added`
    );
  } catch (error) {
    console.error('❌ Nylas callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=callback_failed`
    );
  }
}
```

---

### Step 9: Test End-to-End

1. **Restart dev server:**

   ```bash
   # Kill existing server
   Get-Process -Name node | Stop-Process -Force
   
   # Start fresh
   npm run dev
   ```

2. **Open browser:**
   - Go to: `http://localhost:3000/dashboard/settings`

3. **Click "Add Microsoft Account":**
   - Should redirect to Microsoft login
   - Complete OAuth flow
   - Should redirect back with success message

4. **Check database:**
   - Verify account was saved
   - Check `nylasGrantId` is populated

5. **Test email sync:**
   - Use `nylasClient.messages.list({ grantId })` to fetch emails
   - Verify emails appear

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Validation script passes (all green)
- [ ] Azure app has correct redirect URIs
- [ ] Azure app has all required permissions
- [ ] Admin consent granted (if work account)
- [ ] Nylas Dashboard Microsoft provider configured (NOT empty)
- [ ] Environment variables all set correctly
- [ ] Can initiate OAuth flow (redirects to Microsoft)
- [ ] OAuth callback succeeds (account added)
- [ ] Account saved to database with grantId
- [ ] Can fetch emails using Nylas API

---

## 🐛 Troubleshooting

### Issue: "404 Error" when adding account

**Cause:** Missing Nylas API key or incorrect URL

**Fix:**
1. Run validation script: `npm run setup:nylas`
2. Check `NYLAS_API_KEY` is set and starts with `nylas_`
3. Check `NYLAS_API_URI` is correct region

---

### Issue: "Microsoft connector not configured"

**Cause:** Step 3 was skipped (THIS WAS YOUR ISSUE LAST TIME!)

**Fix:**
1. Go to Nylas Dashboard → Integrations → Microsoft
2. Enter your Azure app credentials:
   - Client ID
   - Client Secret
   - Tenant ID: "common"
3. Click "Save"
4. Verify settings are NOT empty

---

### Issue: "Redirect URI mismatch"

**Cause:** Azure redirect URIs don't include Nylas callback

**Fix:**
1. Go to Azure Portal → Your App → Authentication
2. Ensure BOTH URIs are added:
   - `https://api.us.nylas.com/v3/connect/callback`
   - `http://localhost:3000/api/nylas/callback`
3. Click "Save"
4. Wait 2-3 minutes for propagation

---

### Issue: "Invalid client"

**Cause:** Wrong Azure credentials in Nylas Dashboard

**Fix:**
1. Go to Azure Portal → Your App
2. Copy **Application (client) ID** again
3. Generate new **Client secret** if needed
4. Go to Nylas Dashboard → Microsoft provider
5. Update credentials
6. Click "Save"

---

## 🎯 Key Differences From Last Time

| Last Time | This Time |
|-----------|-----------|
| ❌ No clear order | ✅ Step-by-step order |
| ❌ Microsoft connector empty | ✅ Explicitly configure in Step 3 |
| ❌ No validation | ✅ Validation script catches issues |
| ❌ Unclear error messages | ✅ Clear fixes for each error |
| ❌ 3+ hours debugging | ✅ 30 minutes setup + testing |

---

## 📚 Additional Resources

- **Nylas Documentation:** https://developer.nylas.com/docs
- **Nylas Dashboard:** https://dashboard.nylas.com
- **Azure Portal:** https://portal.azure.com
- **Support:** https://support.nylas.com

---

## 🚀 Next Steps After Setup

Once OAuth is working:

1. **Implement webhook handler** (real-time sync)
2. **Add email sync background job**
3. **Implement folder detection**
4. **Add contact sync**
5. **Test with multiple accounts**

---

**Remember:** The key is doing Step 3 (Configure Nylas Microsoft Provider) correctly. This was missing last time and caused all the problems!

