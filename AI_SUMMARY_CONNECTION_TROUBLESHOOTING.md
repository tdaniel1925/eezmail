# AI Summary Connection Troubleshooting Guide

## Issue

AI summary hover popup shows "Failed to generate summary" error.

## Common Causes & Solutions

### 1. ✅ Check OpenAI API Key

**The most common cause is a missing or invalid OpenAI API key.**

#### How to Check:

1. **Open your `.env.local` file** in the project root
2. **Look for this line:**

   ```bash
   OPENAI_API_KEY=sk-...
   ```

3. **Verify:**
   - ✅ The key starts with `sk-`
   - ✅ The key is not wrapped in quotes
   - ✅ There are no spaces before or after the equals sign
   - ✅ The key is valid and active in your OpenAI account

#### Example (Correct):

```bash
OPENAI_API_KEY=sk-proj-abcd1234567890...
```

#### Example (Incorrect):

```bash
OPENAI_API_KEY="sk-proj-abcd1234..."  # ❌ No quotes
OPENAI_API_KEY = sk-proj-abcd1234...   # ❌ No spaces around =
OPENAI_API_KEY=your-key-here           # ❌ Need actual key
```

#### If Missing:

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
4. **Restart the dev server** (IMPORTANT!)
   ```bash
   # Kill the server (Ctrl+C)
   npm run dev
   ```

---

### 2. ✅ Check Server Logs

**With the improved error logging, check your console for detailed error messages:**

#### In Browser Console (F12):

Look for these logs when you hover:

- 🔍 `Fetching AI summary for email: [id]`
- 📡 `API Response Status: [status]`
- ✅ `API Response Data: [data]` (success)
- ❌ `API Error: [error]` (failure)

#### In Terminal (Server logs):

Look for:

- `Error in summarize API: [error]`
- `OpenAI API key not configured`
- Network/connection errors

---

### 3. ✅ Check Network Connection

**Ensure your server can reach OpenAI's API:**

1. Check if you're behind a firewall/VPN
2. Verify internet connection is stable
3. Check if OpenAI API is operational: https://status.openai.com/

---

### 4. ✅ Check Email Content

**The AI summary requires sufficient email content:**

The API will return a simple message if:

- Email body is less than 50 characters
- Email body is empty after cleaning (signatures, images removed)

In these cases, the subject line is returned as the "summary".

---

## Testing the Fix

### Step 1: Verify Environment Variable

```powershell
# In PowerShell (Windows)
cd C:\dev\win-email_client
Get-Content .env.local | Select-String "OPENAI_API_KEY"
```

### Step 2: Restart Server

```bash
# Kill existing server
# Then restart
npm run dev
```

### Step 3: Test Hover Popup

1. Navigate to inbox
2. Hover over an email card
3. Wait 500ms
4. Check browser console (F12 → Console tab)
5. Look for detailed logs:
   ```
   🔍 Fetching AI summary for email: abc-123
   📡 API Response Status: 200
   ✅ API Response Data: { success: true, summary: "..." }
   ✅ Summary set successfully
   ```

---

## Error Messages Explained

### "OpenAI API key not configured"

**Cause:** Environment variable `OPENAI_API_KEY` is missing or empty.

**Solution:** Add the key to `.env.local` and restart server.

---

### "Unauthorized" (401)

**Cause:** User is not logged in.

**Solution:** Refresh the page and log in again.

---

### "Email not found" (404)

**Cause:** The email doesn't exist in the database.

**Solution:** Sync your emails or try a different email.

---

### "Failed to generate summary" (500)

**Cause:** OpenAI API error (rate limit, invalid key, network issue).

**Solution:**

1. Check API key validity on OpenAI dashboard
2. Check rate limits and usage
3. Check network connection
4. Review server logs for specific error

---

### "Email too short to summarize"

**Cause:** Email body is less than 50 characters.

**Solution:** This is normal. The subject line is used as the summary instead.

---

## Updated Error Display

The popup now shows more helpful error information:

```
❌ Failed to generate summary

Check console for details. Possible causes:
• OpenAI API key not configured
• Network connection issue
• Email content too short
```

---

## Quick Checklist

Before testing, verify:

- [ ] `.env.local` exists in project root
- [ ] `OPENAI_API_KEY` is set in `.env.local`
- [ ] API key starts with `sk-`
- [ ] API key is valid on OpenAI platform
- [ ] Dev server was restarted after adding key
- [ ] Browser console is open (F12) to see logs
- [ ] Internet connection is working
- [ ] You're logged in to the app

---

## If Still Not Working

1. **Check the exact error in console:**

   ```
   Open Browser Console (F12)
   → Console tab
   → Look for red error messages
   → Copy the error message
   ```

2. **Check server terminal:**

   ```
   Look for error messages in the terminal where npm run dev is running
   ```

3. **Verify OpenAI API is working:**

   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

4. **Check if other AI features work:**
   - Try the AI chatbot
   - Try AI-generated replies
   - If nothing AI works, it's definitely the API key

---

## Files Modified

**`src/components/email/ExpandableEmailItem.tsx`**

- Enhanced error logging with detailed console messages
- Improved error display in popup UI
- Shows specific error causes to help debugging

---

## Status: ✅ DEBUGGING ENHANCED

**Enhanced error logging**  
**Better error messages**  
**Console debugging enabled**  
**User-friendly error display**

Now you can see exactly what's wrong! 🔍

---

_Last Updated: October 22, 2025_

