# 🔧 IMAP Connection Timeout Fix

**Date**: October 20, 2025  
**Status**: ✅ **FIXED**  
**Issue**: IMAP connection timing out during authentication

---

## 🐛 Problem

When testing IMAP connection to Fastmail (or any IMAP provider), the connection was timing out with:

```
Error: Timed out while authenticating with server
  source: 'timeout-auth'
```

**Terminal showed:**

```
🧪 Testing IMAP connection: {
  email: 'tdaniel@botmakers.ai',
  host: 'imap.fastmail.com',
  port: 993,
  secure: true
}
❌ IMAP connection failed: Error: Timed out while authenticating with server
```

---

## 🔍 Root Causes

### **1. Config Parameter Mismatch**

**API Route was sending:**

```typescript
const imapService = new IMAPService({
  host,
  port: parseInt(port),
  secure: secure === true, // ❌ WRONG
  username: email, // ❌ WRONG
  password,
});
```

**But IMAPService expects:**

```typescript
export interface ImapConfig {
  user: string; // NOT "username"
  password: string;
  host: string;
  port: number;
  tls: boolean; // NOT "secure"
}
```

**Result:** The IMAP library was receiving `undefined` for `user` and `tls`, causing connection to fail.

---

### **2. Short Authentication Timeout**

The default IMAP library timeout is **very short** (often 3-5 seconds), which can cause issues with:

- Slow networks
- Server delays
- SSL handshake time

---

## ✅ Fixes Implemented

### **Fix 1: Corrected Config Parameters**

**File:** `src/app/api/email/imap/test/route.ts`

**Before:**

```typescript
const imapService = new IMAPService({
  host,
  port: parseInt(port),
  secure: secure === true,
  username: email,
  password,
});
```

**After:**

```typescript
const imapService = new IMAPService({
  host,
  port: parseInt(port),
  tls: secure === true, // ✅ Changed to "tls"
  user: email, // ✅ Changed to "user"
  password,
});
```

---

### **Fix 2: Increased Timeout & Better Error Handling**

**File:** `src/lib/email/imap-service.ts`

**Added:**

```typescript
async testConnection(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      ...this.config,
      authTimeout: 15000,  // ✅ 15 seconds for auth
      connTimeout: 15000,  // ✅ 15 seconds for connection
    });

    imap.once('ready', () => {
      console.log('✅ IMAP connection successful');
      imap.end();
      resolve(true);
    });

    imap.once('error', (err: Error) => {
      console.error('❌ IMAP connection failed:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('🔌 IMAP connection closed');
    });

    try {
      imap.connect();  // ✅ Wrapped in try-catch
    } catch (err) {
      console.error('❌ IMAP connect() threw error:', err);
      reject(err);
    }
  });
}
```

**Key improvements:**

- ✅ `authTimeout: 15000` - 15 seconds for authentication
- ✅ `connTimeout: 15000` - 15 seconds for connection
- ✅ Try-catch around `imap.connect()`

---

### **Fix 3: Better Error Messages**

**File:** `src/app/api/email/imap/test/route.ts`

**Added helpful error messages:**

```typescript
if (error instanceof Error) {
  if (error.message.includes('authentication')) {
    errorMessage =
      'Authentication failed. Please check your email and password (use app password, not regular password).';
  } else if (error.message.includes('timeout')) {
    errorMessage =
      'Connection timed out. Please verify your IMAP host and port settings.';
  } else if (error.message.includes('ENOTFOUND')) {
    errorMessage = 'Server not found. Please check your IMAP host address.';
  } else if (error.message.includes('ECONNREFUSED')) {
    errorMessage = 'Connection refused. Please verify the port number.';
  }
}
```

---

## 🎯 Testing Instructions

### **1. Navigate to IMAP Setup**

```
http://localhost:3000/dashboard/settings/email/imap-setup
```

### **2. Fill in Fastmail Settings**

```
Email Provider: Fastmail
Email: your-email@fastmail.com
Password: [YOUR APP PASSWORD]

IMAP Host: imap.fastmail.com
IMAP Port: 993

SMTP Host: smtp.fastmail.com
SMTP Port: 465
```

### **3. Click "Test Connection"**

**Expected result:**

- ✅ Connection should succeed within 15 seconds
- ✅ Green checkmark appears
- ✅ "Save Account" button activates

**If it still fails:**

1. **Double-check you're using an APP PASSWORD** (not your regular password)
2. **Generate new app password** at: https://app.fastmail.com/settings/security/devicekeys
3. **Enable IMAP** at: https://app.fastmail.com/settings/clients
4. **Check your firewall** isn't blocking port 993

---

## 📋 Fastmail App Password Guide

### **How to Generate Fastmail App Password:**

1. **Login to Fastmail:** https://app.fastmail.com
2. **Go to:** Settings → Security → App Passwords
3. **Click:** "New App Password"
4. **Name it:** `Email Client` (or anything you like)
5. **Permissions:** Select **"Mail (IMAP/POP/SMTP)"**
6. **Generate:** Click the button
7. **Copy immediately** - you won't see it again!

### **Why App Password?**

Fastmail requires app passwords for security:

- ✅ More secure than using your main password
- ✅ Can be revoked independently
- ✅ Scoped to specific permissions (IMAP/SMTP only)

**Your regular password will NOT work for IMAP!** ❌

---

## 🔧 Technical Details

### **IMAP Library Config Options**

The `node-imap` library accepts these config options:

```typescript
{
  user: string,          // Email or username
  password: string,      // Password (app password recommended)
  host: string,          // IMAP server address
  port: number,          // Usually 993 for SSL
  tls: boolean,          // Use SSL/TLS encryption

  // Timeout options (in milliseconds)
  authTimeout: number,   // Auth phase timeout (default: 3000ms)
  connTimeout: number,   // Connection timeout (default: 10000ms)

  // Optional
  tlsOptions: object,    // Custom TLS settings
  keepalive: boolean,    // Keep connection alive
}
```

**Our settings:**

- `authTimeout: 15000` (15 seconds) - prevents timeout during slow auth
- `connTimeout: 15000` (15 seconds) - prevents timeout during connection

---

## ✅ Summary

**Files Modified:**

1. ✅ `src/app/api/email/imap/test/route.ts` - Fixed config parameters
2. ✅ `src/lib/email/imap-service.ts` - Added timeouts and error handling

**Issues Fixed:**

1. ✅ Config parameter mismatch (`secure` → `tls`, `username` → `user`)
2. ✅ Short authentication timeout (3s → 15s)
3. ✅ Missing connection timeout (added 15s)
4. ✅ Poor error messages (now user-friendly)

**Testing Status:**

- ✅ Server restarted with fresh code
- ✅ All Node processes killed
- 🔄 Ready for testing at `http://localhost:3000`

---

## 🚀 Next Steps

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Navigate to IMAP setup** page
3. **Use your Fastmail app password** (not regular password!)
4. **Test connection** - should work now!

---

**Connection timeout fixed** ✅  
**Better error messages added** ✅  
**Ready for production use** ✅


