# AI Reply Name and Signature Fix

## The Issues

Looking at the user's screenshot, two critical issues were identified:

1. **Missing greeting** - The AI reply didn't start with "Hi An," (no greeting at all)
2. **Missing name/signature** - After "Best regards," there was just the quoted email (red line shows where name should be)

## The Fixes

### 1. Enforce Greeting in User Prompt

Updated the user prompt to be more explicit about requiring a greeting:

```typescript
IMPORTANT:
- You MUST start with a greeting like "Hi [Name]," on its own line
- Extract the sender's first name from the email address or content
- End with ONLY the closing (e.g., "Best regards,") - do NOT add your name or signature
```

This ensures the AI always includes a proper greeting at the start.

### 2. Add User Name After Closing

Modified the signature appending logic to:

1. Get the user's name from Supabase auth
2. Add blank line after closing
3. Add user's name
4. Add signature (if available) after name

```typescript
// Get user's name from Supabase auth
const {
  data: { user: authUser },
} = await supabase.auth.getUser();
const userName =
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')[0] ||
  'User';

// Add blank line after closing, then name
finalReply = `${finalReply}\n\n${userName}`;

if (userSignature?.textContent) {
  // Add signature after name
  finalReply = `${finalReply}\n${userSignature.textContent.trim()}`;
}
```

## How It Works

### Name Resolution Priority:

1. `full_name` from user metadata (if set)
2. `name` from user metadata (if set)
3. Email username (part before @)
4. Fallback to "User"

### Before (Missing Name):

```
[AI reply body paragraphs...]

Best regards,
--- On 8/24/2025, andy@infinityconcepts.com wrote:
```

### After (With Name):

```
[AI reply body paragraphs...]

Best regards,

John Doe
CEO, BotMakers Inc.  (if signature exists)
--- On 8/24/2025, andy@infinityconcepts.com wrote:
```

## Structure Now

```
Hi [Recipient Name],

[Paragraph 1 - 2-3 sentences]

[Paragraph 2 - 2-3 sentences]

[Paragraph 3 - 2-3 sentences]

Best regards,

[Your Name]
[Signature line 1 (if exists)]
[Signature line 2 (if exists)]
```

## Files Modified

**`src/app/api/ai/generate-reply/route.ts`**

1. **Lines 134-137:** Added explicit greeting requirement to user prompt

   ```typescript
   IMPORTANT:
   - You MUST start with a greeting like "Hi [Name]," on its own line
   - Extract the sender's first name from the email address or content
   - End with ONLY the closing (e.g., "Best regards,") - do NOT add your name or signature
   ```

2. **Lines 381-394:** Updated signature logic to include user's name

   ```typescript
   // Get user's name from Supabase auth
   const {
     data: { user: authUser },
   } = await supabase.auth.getUser();
   const userName =
     authUser?.user_metadata?.full_name ||
     authUser?.user_metadata?.name ||
     authUser?.email?.split('@')[0] ||
     'User';

   // Add blank line after closing, then name
   finalReply = `${finalReply}\n\n${userName}`;

   if (userSignature?.textContent) {
     // Add signature after name
     finalReply = `${finalReply}\n${userSignature.textContent.trim()}`;
   }
   ```

## Benefits

✅ **Greeting always present** - AI explicitly instructed to start with greeting
✅ **Name always included** - User's name appears after closing
✅ **Blank line before name** - Proper spacing with `\n\n`
✅ **Signature support** - Optional signature appears after name
✅ **Professional format** - Matches standard email conventions

## Visual Result

### What User Will See:

```
Hi An,

Thank you for reaching out and sharing your project idea. It was indeed a pleasure connecting during our recent call.

Your concept of a Life Dashboard sounds intriguing and has the potential to streamline many daily tasks. I will review the attached technical specifications with my team to determine feasibility and resources required.

Typically, projects of this nature can take anywhere from 8 to 12 weeks, depending on complexity. I will also prepare an initial cost estimate and get back to you shortly.

Looking forward to discussing this further.

Best regards,

Trent Daniel
CEO, BotMakers Inc.
trent@botmakers.ai
```

## Spacing Breakdown

1. **Greeting** → blank line (`<p></p>`)
2. **Paragraph 1** → blank line (`<p></p>`)
3. **Paragraph 2** → blank line (`<p></p>`)
4. **Paragraph 3** → blank line (`<p></p>`)
5. **Closing** → blank line (`\n\n`)
6. **Name** → optional signature lines
7. **Quoted email**

## Testing Checklist

- [ ] Greeting appears at start (e.g., "Hi [Name],")
- [ ] Blank line after greeting
- [ ] Paragraphs properly separated
- [ ] Blank line before closing
- [ ] Closing appears (e.g., "Best regards,")
- [ ] Blank line after closing
- [ ] User's name appears
- [ ] Signature appears (if set)
- [ ] No duplicate names or signatures

## Status

✅ **Implementation Complete**
⏳ **Awaiting User Testing**

Refresh your browser and generate a new AI reply. The greeting should appear at the top, and your name should appear after "Best regards," with a blank line in between!

---

**Date:** 2025-01-24
**Issue 1:** Missing greeting at start of AI reply
**Solution 1:** Added explicit instruction in user prompt to include greeting
**Issue 2:** Missing name/signature after closing
**Solution 2:** Fetch user name from Supabase auth and append after closing with blank line
