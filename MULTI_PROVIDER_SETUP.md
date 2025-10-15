# Multi-Provider Email Integration Setup

This guide will help you set up the new multi-provider email integration with Microsoft Graph API, Google Gmail API, and IMAP support.

## 🚀 What's New

- **Microsoft Graph API**: Direct integration with Microsoft/Outlook accounts
- **Google Gmail API**: Direct integration with Gmail accounts
- **IMAP Support**: Universal support for any email provider
- **No Third-Party Dependencies**: Bypass Nylas issues entirely

## 🔧 Environment Variables Setup

Add these variables to your `.env.local` file:

### Microsoft Graph API (for Outlook accounts)

```bash
# Microsoft Graph API Configuration
MICROSOFT_CLIENT_ID=your_azure_client_id
MICROSOFT_CLIENT_SECRET=your_azure_client_secret
MICROSOFT_TENANT_ID=common
```

### Google Gmail API (for Gmail accounts)

```bash
# Google Gmail API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### App Configuration

```bash
# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 Setup Instructions

### 1. Microsoft Graph API Setup

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create App Registration**:
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: "Imbox Email Client"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:3000/api/auth/microsoft/callback`

3. **Configure API Permissions**:
   - Go to "API permissions" → "Add a permission"
   - Select "Microsoft Graph" → "Delegated permissions"
   - Add these permissions:
     - `Mail.ReadWrite`
     - `User.Read`
   - Click "Grant admin consent"

4. **Get Credentials**:
   - Go to "Certificates & secrets" → "New client secret"
   - Copy the secret value
   - Go to "Overview" and copy the "Application (client) ID"

5. **Update Environment Variables**:
   ```bash
   MICROSOFT_CLIENT_ID=your_application_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret_value
   MICROSOFT_TENANT_ID=common
   ```

### 2. Google Gmail API Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create Project** (if needed)
3. **Enable Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

5. **Get Credentials**:
   - Copy the "Client ID" and "Client Secret"

6. **Update Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### 3. IMAP Setup (No API Keys Required)

IMAP works with any email provider without additional API setup. Users just need:

1. **Enable IMAP** in their email settings
2. **Generate App Password** (not regular password)
3. **Use correct IMAP settings** for their provider

## 🎯 How to Use

### For Users:

1. **Go to Settings** → **Email Accounts**
2. **Click "Add Account"**
3. **Choose Provider**:
   - **Microsoft/Outlook (Graph API)**: For Outlook accounts
   - **Gmail (Gmail API)**: For Gmail accounts
   - **IMAP (Universal)**: For any email provider

4. **Follow the setup process**:
   - OAuth providers: Click and authorize
   - IMAP: Enter credentials and test connection

### For Developers:

The new system provides three integration options:

```typescript
// Microsoft Graph API
const msGraph = new MicrosoftGraphService(config);
const authUrl = msGraph.generateAuthUrl(state);
const token = await msGraph.exchangeCodeForToken(code);

// Google Gmail API
const gmail = new GmailService(config);
const authUrl = gmail.generateAuthUrl(state);
const token = await gmail.exchangeCodeForToken(code);

// IMAP Service
const imap = new IMAPService(config);
const isConnected = await imap.testConnection();
const emails = await imap.getEmails(50);
```

## 🔄 Migration from Nylas

The new system completely replaces Nylas:

1. **Remove Nylas dependencies** (optional)
2. **Update environment variables** with new API keys
3. **Test each provider** individually
4. **Update UI** to show new provider options

## 🚨 Troubleshooting

### Microsoft Graph Issues:

- Ensure redirect URI matches exactly
- Check API permissions are granted
- Verify tenant ID is correct

### Google Gmail Issues:

- Ensure Gmail API is enabled
- Check OAuth consent screen is configured
- Verify redirect URI matches

### IMAP Issues:

- Use app passwords, not regular passwords
- Check IMAP is enabled in email settings
- Verify server settings are correct

## 📊 Benefits

- **No Third-Party Dependencies**: Direct API integration
- **Better Reliability**: Direct provider integration
- **Universal Support**: IMAP works with any email
- **Full Control**: Complete control over the integration
- **Cost Effective**: No third-party service fees

## 🎉 Next Steps

1. **Set up environment variables** for your chosen providers
2. **Test the connections** using the new UI
3. **Configure OAuth apps** in Azure/Google Cloud
4. **Start using the new email integration**!

The new system provides a robust, reliable email integration that bypasses all the Nylas issues you were experiencing.
