# 🔧 Aurinko Configuration with ngrok

## Your ngrok URL:

```
https://unnew-marina-busied.ngrok-free.dev
```

---

## ✅ Steps to Complete Setup:

### **Step 1: Add Redirect URI to Aurinko Dashboard**

1. Go to your Aurinko dashboard (the EaseMail app)
2. Find "Redirect URIs" or "Return URLs" section
3. Add this exact URL:
   ```
   https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback
   ```
4. Click "Save" or "Update"

---

### **Step 2: Update Your `.env.local`**

Add or update this line in your `.env.local` file:

```bash
# Aurinko API Credentials
AURINKO_CLIENT_ID=a6e4e3ac0292a03a44529...  # (your existing value)
AURINKO_CLIENT_SECRET=sec_...  # (your existing value)
NEXT_PUBLIC_AURINKO_APP_ID=a6e4e3ac0292a03a44529...  # (your existing value)

# ⭐ UPDATE THIS LINE:
AURINKO_REDIRECT_URI=https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback
```

---

### **Step 3: Restart Your Dev Server**

```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

---

### **Step 4: Test Configuration**

```bash
curl https://unnew-marina-busied.ngrok-free.dev/api/test-aurinko
```

Should return:

```json
{
  "success": true,
  "message": "Aurinko is configured correctly",
  "redirectUri": "https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback"
}
```

---

### **Step 5: Connect Your IMAP Account**

Visit this URL in your browser:

```
https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/connect
```

You should be redirected to Aurinko's IMAP connection page!

---

## 📝 Important Notes:

### **ngrok URL Persistence:**

- ✅ Your URL: `https://unnew-marina-busied.ngrok-free.dev`
- ⚠️ This URL will change if you restart ngrok
- 💡 Keep ngrok running while testing
- 💰 Get a paid ngrok account for a permanent URL

### **What to Enter in Aurinko (Step 5):**

When you reach the IMAP connection page, enter:

- **Email:** your@email.com
- **IMAP Server:** imap.yourdomain.com (e.g., imap.fastmail.com)
- **IMAP Port:** 993
- **SMTP Server:** smtp.yourdomain.com (e.g., smtp.fastmail.com)
- **SMTP Port:** 465 or 587
- **Username:** your@email.com
- **Password:** your_password (use app password if available)

---

## 🎯 Quick Checklist:

- [ ] ngrok is running: `ngrok http 3000`
- [ ] Redirect URI added to Aurinko dashboard
- [ ] `.env.local` updated with ngrok URL
- [ ] Dev server restarted: `npm run dev`
- [ ] Test endpoint returns success
- [ ] Ready to connect IMAP account!

---

**Your ngrok URL:** `https://unnew-marina-busied.ngrok-free.dev`  
**Connect URL:** `https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/connect`

🚀 **You're ready to test!**
