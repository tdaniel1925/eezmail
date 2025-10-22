# Communication Features - Quick Start Guide

## 🎯 Implementation Complete!

All communication features (SMS, Voice, Email integration) are now fully implemented and ready for testing.

---

## 📋 Setup Instructions

### 1. Run Database Migration

```bash
psql -U postgres -d your_database_name -f migrations/add_communication_features.sql
```

Or using Supabase SQL Editor:
1. Open your Supabase project
2. Go to SQL Editor
3. Copy/paste contents of `migrations/add_communication_features.sql`
4. Run the migration

### 2. Generate Encryption Key

```bash
openssl rand -hex 32
```

Copy the output (64-character hex string).

### 3. Configure Environment Variables

Add to your `.env.local`:

```bash
# Encryption key for Twilio credentials (generated above)
ENCRYPTION_KEY=your_64_character_hex_string_here

# System-wide Twilio credentials (for users without custom accounts)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Install Dependencies (Already Done)

```bash
npm install twilio
```

This has already been completed. ✅

### 5. Restart Dev Server

```bash
npm run dev
```

---

## 🧪 Testing Steps

### Test 1: Send SMS to Contact

1. Go to **Contacts**
2. Open any contact detail view
3. You'll see **Quick Actions** at the top:
   - Email
   - SMS
   - Call
4. Click **SMS**
5. Type a test message (max 160 characters)
6. Click **Send SMS**
7. **Expected Result:**
   - Toast notification: "SMS sent to [Contact Name]"
   - Contact timeline shows "SMS Sent" event
   - SMS is delivered to the phone number

### Test 2: Make Voice Call (TTS)

1. From the same contact, click **Call**
2. Enter a message like "This is a test voice call from Imbox"
3. Click **Make Call**
4. **Expected Result:**
   - Toast notification: "Voice call initiated"
   - Contact timeline shows "Voice Call Made" event
   - Phone receives call and hears the message

### Test 3: Rate Limiting

1. Send 1 SMS to a contact
2. Immediately try to send another SMS
3. **Expected Result:**
   - Toast error: "Rate limit exceeded. Try again in X seconds"
   - Second SMS is blocked
   - (Personal plan: 1 SMS per minute)

### Test 4: Custom Twilio Settings

1. Go to **Settings** (or wherever you add the Communication tab)
2. Toggle **"Use My Own Twilio Account"**
3. Enter your credentials:
   - Account SID
   - Auth Token
   - Phone Number (E.164 format: +1234567890)
4. Click **Test Credentials**
5. **Expected Result:** Green toast "Twilio credentials are valid!"
6. Click **Save Settings**
7. Send SMS or make call
8. **Expected Result:** Uses your Twilio account (check Twilio logs)

### Test 5: Missing Phone/Email

1. Open a contact with no phone number
2. **Expected Result:**
   - SMS button is grayed out/disabled
   - Call button is grayed out/disabled
   - Clicking shows toast: "No phone number available"

### Test 6: Timeline Logging

1. After sending SMS or making call
2. Go to contact's **Timeline** tab
3. **Expected Result:**
   - See "SMS Sent" or "Voice Call Made" event
   - Event shows message preview, phone number, timestamp

---

## 🔧 Integration with Settings Page

You need to add the Communication Settings component to your Settings page:

### Option A: Add to Existing Settings Page

**File:** `src/app/dashboard/settings/page.tsx` (or your settings file)

```tsx
import { CommunicationSettings } from '@/components/settings/CommunicationSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Your existing settings tabs/sections */}
      
      {/* Add Communication Section */}
      <CommunicationSettings />
    </div>
  );
}
```

### Option B: Add as Separate Tab

If you have a tabbed settings interface:

```tsx
const settingsTabs = [
  { id: 'profile', label: 'Profile', component: ProfileSettings },
  { id: 'communication', label: 'Communication', component: CommunicationSettings },
  { id: 'notifications', label: 'Notifications', component: NotificationSettings },
];
```

---

## 📊 What's Working

✅ **SMS Sending**
- Single contact SMS
- Group SMS (via `sendGroupSMS`)
- Rate limiting
- Timeline logging

✅ **Voice Calls**
- Text-to-speech calls
- Rate limiting
- Timeline logging

✅ **Custom Twilio**
- Credential encryption
- Credential validation
- Per-user Twilio accounts
- Billing bypass

✅ **Security**
- AES-256-GCM encryption
- Masked credential display
- Rate limit protection

✅ **UI Components**
- Communication action buttons
- SMS composer modal
- Voice message modal
- Settings page

---

## 🚧 Optional Enhancements (Future)

These are NOT required for the current implementation to work:

### 1. Group Communication UI
- Add "Send Group SMS" button to group detail view
- Show bulk message status (sent/failed counts)

### 2. Admin Dashboard
- View all users' communication usage
- Adjust individual rate limits
- Monitor costs
- Export reports

### 3. API Routes (Optional)
- Currently using server actions directly (cleaner)
- Can add REST endpoints if needed for external integrations

---

## ❓ Troubleshooting

### "Failed to send SMS"
- Check Twilio credentials in `.env.local`
- Verify phone number is in E.164 format (+1234567890)
- Check Twilio account balance
- View detailed error in browser console

### "Rate limit exceeded"
- Wait 1 minute (personal plan)
- Or upgrade plan limits in database:
  ```sql
  UPDATE communication_limits
  SET sms_per_minute = 10
  WHERE user_id = 'your_user_id';
  ```

### "Encryption error"
- Verify `ENCRYPTION_KEY` is exactly 64 characters (32 bytes in hex)
- Generate new key: `openssl rand -hex 32`

### SMS not delivered
- Check recipient phone number is valid
- Check Twilio account status
- Verify phone number is verified (if trial account)
- Check Twilio logs at console.twilio.com

---

## 📞 Support

- **Twilio Docs:** https://www.twilio.com/docs
- **Code Documentation:** All functions have inline JSDoc comments
- **Database Schema:** See `migrations/add_communication_features.sql`

---

## ✅ Summary

**Status:** ✅ **COMPLETE & READY FOR TESTING**

**What You Can Do Now:**
1. Run database migration
2. Add environment variables
3. Restart dev server
4. Send SMS and make calls from contact cards
5. Configure custom Twilio in Settings
6. View communication events in contact timelines

**Files Changed:** 14 new, 3 updated  
**Total LOC:** ~2,500 lines  

Enjoy your new communication features! 🎉

