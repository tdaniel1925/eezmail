# Email Reply Composer - Signature and Blank Lines

## Overview

Updated the email reply composer to insert 3 blank lines at the top for the user to type their reply, followed by their email signature, and then the quoted original message.

## Changes Made

### 1. EmailComposer Component (`src/components/email/EmailComposer.tsx`)

#### Signature Fetching

Added logic to fetch the user's email signature before composing the reply body:

```typescript
// Fetch user's signature
let signatureHtml = '';
try {
  const sigResponse = await fetch('/api/email/signature');
  if (sigResponse.ok) {
    const sigData = await sigResponse.json();
    if (sigData.signature) {
      signatureHtml = `<p><br></p><p>${sigData.signature}</p>`;
    }
  }
} catch (sigError) {
  console.error('Failed to fetch signature:', sigError);
  // Continue without signature
}
```

#### Body Composition

**With AI Reply:**

```typescript
// Format: AI reply HTML + signature + quoted text
finalBody = `${aiReplyHtml}${signatureHtml}${result.data.body}`;
```

**Without AI Reply (Manual Reply):**

```typescript
// Add 3 blank lines at the top for user to type + signature + quoted text
finalBody = `<p><br></p><p><br></p><p><br></p>${signatureHtml}${result.data.body}`;
```

### 2. Signature API Endpoint (`src/app/api/email/signature/route.ts` - NEW)

Created a new API endpoint to fetch the user's email signature:

**Features:**

- Fetches from `emailSignatures` table
- Returns default signature for the user's first active account
- Falls back to a simple signature if none configured:
  ```
  Best regards,
  [user email]
  ```

**Endpoint:** `GET /api/email/signature`

**Response:**

```json
{
  "signature": "<p>Best regards,<br>user@example.com</p>"
}
```

## Email Structure

### Reply Email Body Structure:

```
┌─────────────────────────────────┐
│                                 │ ← Blank line 1 (cursor here)
│                                 │ ← Blank line 2
│                                 │ ← Blank line 3
│                                 │
│ Best regards,                   │ ← Signature
│ user@example.com                │
│                                 │
│ ---                             │ ← Separator
│ On 8/24/2025, andy@...wrote:    │ ← Original message header
│                                 │
│ [Original email content...]     │ ← Quoted text
│                                 │
└─────────────────────────────────┘
```

### With AI Reply:

```
┌─────────────────────────────────┐
│ Hi Andy,                        │ ← AI-generated reply
│                                 │
│ Thank you for sharing...        │
│                                 │
│ Best regards,                   │ ← Signature
│ user@example.com                │
│                                 │
│ ---                             │ ← Separator
│ On 8/24/2025, andy@...wrote:    │
│                                 │
│ [Original email content...]     │
└─────────────────────────────────┘
```

## Technical Details

### HTML Format

The 3 blank lines are inserted as:

```html
<p><br /></p>
<p><br /></p>
<p><br /></p>
```

This ensures proper spacing in the TipTap editor.

### Signature Format

Signature is wrapped with spacing:

```html
<p><br /></p>
<p>Best regards,<br />user@example.com</p>
```

### Quoted Text Format

From `getEmailForReply` in `email-actions.ts`:

```
---
On [date], [sender] wrote:

[original message]
```

## Database Schema

### emailSignatures Table

The signature is fetched from the `email_signatures` table:

**Fields Used:**

- `userId` - User who owns the signature
- `accountId` - Email account associated with signature
- `htmlContent` - The HTML signature content
- `isDefault` - Whether this is the default signature

**Query Logic:**

1. Find user's first active email account
2. Find default signature for that account
3. Return `htmlContent` or fallback to default

## User Experience

### Before

❌ Reply composer opened with quoted text immediately, no space for user input
❌ No signature automatically inserted
❌ User had to manually type signature every time

### After

✅ 3 blank lines at top for user to type reply
✅ Signature automatically inserted below blank lines
✅ Quoted original message below signature
✅ Cursor positioned at top blank line for immediate typing
✅ Professional email structure maintained

## Configuration

### Default Signature

If no signature is configured, a default is used:

```html
<p>Best regards,<br />[user's email]</p>
```

### Custom Signature

Users can configure custom signatures in the `email_signatures` table:

- HTML formatting supported
- Can include name, title, company, etc.
- Per-account signatures supported
- `isDefault` flag determines which signature to use

## Testing

1. ✅ Click Reply button on any email
2. ✅ Composer opens with 3 blank lines at top
3. ✅ Signature appears below blank lines
4. ✅ Original message appears below signature
5. ✅ Cursor positioned at first blank line
6. ✅ User can immediately start typing
7. ✅ AI reply (if available) appears above signature
8. ✅ Fallback signature works if none configured

## Files Modified

1. **`src/components/email/EmailComposer.tsx`**
   - Added signature fetching logic
   - Updated body composition for reply mode
   - Inserts 3 blank lines + signature + quoted text

2. **`src/app/api/email/signature/route.ts`** (NEW)
   - Created signature API endpoint
   - Fetches from database
   - Provides fallback signature

## Future Enhancements

### Possible improvements:

1. **Signature Editor UI**
   - Allow users to create/edit signatures in settings
   - Rich text editor for signature formatting
   - Multiple signature templates

2. **Signature Selection**
   - Choose different signatures per email
   - Work vs personal signatures
   - Dropdown in composer to select signature

3. **Smart Signatures**
   - Different signatures based on recipient
   - Time-based signatures (e.g., holiday signatures)
   - Role-based signatures

4. **Signature Variables**
   - Dynamic fields like `{{name}}`, `{{date}}`
   - Company info insertion
   - Meeting links, social media

---

**Status**: ✅ Complete! Reply emails now have 3 blank lines, signature, and quoted text.
