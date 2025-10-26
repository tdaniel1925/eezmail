# Gmail Incremental Authorization Implementation

## ✅ What Was Changed

We've implemented **incremental authorization** for Gmail OAuth to follow Google's best practices and remove the warning in Google Cloud Console.

---

## 🎯 How It Works

### **Phase 1: Initial Connection** (Minimal Scopes)

When a user first connects their Gmail account, we only request:

- ✅ `userinfo.email` - User's email address
- ✅ `userinfo.profile` - User's name and avatar
- ✅ `gmail.readonly` - Read emails

**Why?** Users are more likely to grant access when we only ask for what we need immediately.

### **Phase 2: Additional Permissions** (When Needed)

When the user tries to perform actions that require more permissions:

- **Send Email**: Request `gmail.send` scope
- **Modify Emails** (archive, delete, mark as read): Request `gmail.modify` scope
- **Draft Management**: Request `gmail.compose` scope

**How?** The app will prompt: *"To send emails, we need additional permissions"* and redirect to Google OAuth with only the new scope.

---

## 🔧 Technical Implementation

### **Updated Files**

1. **`src/lib/email/gmail-api.ts`**
   - Added `GMAIL_SCOPES` constant with organized scope sets
   - Updated `generateAuthUrl()` to accept `scopeLevels` parameter
   - Added `include_granted_scopes: 'true'` to OAuth params (KEY CHANGE)

2. **`src/app/api/auth/google/route.ts`**
   - Updated to use incremental scopes
   - Added support for `?scopes=` query parameter for requesting additional scopes

3. **`src/lib/settings/email-actions.ts`**
   - Updated Gmail connection to start with `['base', 'read']` scopes only

---

## 📊 Scope Levels

```typescript
export const GMAIL_SCOPES = {
  BASE: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  
  READ: [
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  
  MODIFY: [
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  
  SEND: [
    'https://www.googleapis.com/auth/gmail.send',
  ],
  
  COMPOSE: [
    'https://www.googleapis.com/auth/gmail.compose',
  ],
};
```

---

## 🚀 Usage Examples

### **Initial Connection** (Minimal Scopes)

```typescript
const gmail = new GmailService(config);
const authUrl = gmail.generateAuthUrl(state, ['base', 'read']);
// Only requests email profile and read access
```

### **Request Send Permission Later**

```typescript
// When user clicks "Send Email" for the first time
const authUrl = gmail.generateAuthUrl(state, ['send']);
// Only requests send permission (already has base + read)
```

### **Request Multiple Additional Scopes**

```typescript
// When user wants to send AND modify emails
const authUrl = gmail.generateAuthUrl(state, ['send', 'modify']);
```

---

## 🔗 API Endpoint for Incremental Auth

To request additional scopes, redirect users to:

```
/api/auth/google?scopes=send,modify
```

Query parameters:
- `scopes` - Comma-separated list of scope levels to request

Example flow:

```typescript
// User clicks "Send Email" button
if (!hasGmailSendPermission) {
  // Redirect to request send permission
  window.location.href = '/api/auth/google?scopes=send';
}
```

---

## ✅ Google Cloud Console Configuration

After this implementation, the Google Cloud Console warning should be **resolved**.

### **What to Verify:**

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Check **"Data access and user consent"** section
5. The "Incremental authorization" warning should be **gone** ✅

### **If Warning Persists:**

1. Make sure you've deployed the updated code
2. Test the OAuth flow to confirm `include_granted_scopes=true` is in the URL
3. Wait 24 hours (Google sometimes caches OAuth client configurations)

---

## 🧪 Testing Incremental Auth

### **Test Initial Connection:**

1. Go to: https://easemail.app/dashboard/settings
2. Click **"Connect Gmail Account"**
3. Check Google consent screen - should only show:
   - "See your email address"
   - "View your Gmail messages"

### **Test Additional Scopes:**

1. After connecting, try to send an email
2. App should prompt: "To send emails, grant additional permission"
3. Redirect to OAuth with only `gmail.send` scope
4. User grants permission
5. Redirect back and email sends successfully

---

## 📈 Benefits

### **User Experience:**
- ✅ Less scary initial permission request
- ✅ Users understand why each permission is needed
- ✅ Higher connection success rate

### **Security:**
- ✅ Principle of least privilege
- ✅ Users only grant what's necessary
- ✅ Can revoke specific permissions later

### **Compliance:**
- ✅ Follows Google OAuth best practices
- ✅ Removes Google Cloud Console warning
- ✅ Required for Google verification/publishing

---

## 🔍 Debugging

### **Check OAuth URL:**

When redirecting to Google OAuth, the URL should include:

```
https://accounts.google.com/o/oauth2/v2/auth?
  ...
  include_granted_scopes=true  <-- THIS IS KEY
  ...
```

### **Check Token Response:**

When exchanging code for token, the response should include all previously granted scopes:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "scope": "email profile gmail.readonly gmail.send",  <-- Multiple scopes
  "expires_in": 3600
}
```

---

## 📚 References

- [Google OAuth 2.0 Incremental Authorization](https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth)
- [Gmail API Scopes](https://developers.google.com/gmail/api/auth/scopes)
- [OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/production-readiness)

---

## ✅ Deployment Checklist

- [x] Updated `gmail-api.ts` with incremental auth support
- [x] Updated OAuth route to support scope levels
- [x] Updated email connection to start with minimal scopes
- [x] Added `include_granted_scopes: true` to OAuth params
- [ ] Test on localhost: Connect Gmail with minimal scopes
- [ ] Test on localhost: Request additional scope (send)
- [ ] Deploy to production: `vercel --prod`
- [ ] Verify Google Cloud Console warning is gone
- [ ] Update OAuth consent screen (if needed)

---

**Status**: ✅ Implementation Complete

**Next Steps**: Deploy to production and verify the warning is removed in Google Cloud Console!

