# Reply Later Bubble - Simplified Behavior

## Issue

User wanted the Reply Later bubble to simply open the email composer with only the "to" field pre-filled, allowing them to manually write the email or use AI tools within the composer. Previously, it was auto-generating an AI draft which was not desired.

## Previous Behavior

When clicking a Reply Later bubble:

1. ❌ Showed loading toast "Writing your response now..."
2. ❌ Automatically called `generateReplyDraft()` API
3. ❌ Pre-filled subject with "Re: [subject]"
4. ❌ Pre-filled body with AI-generated draft
5. ❌ Set mode to "reply"

## New Behavior

When clicking a Reply Later bubble:

1. ✅ Opens composer immediately (no loading)
2. ✅ Pre-fills ONLY the "to" field with sender's email address
3. ✅ Subject is empty
4. ✅ Body is empty
5. ✅ Mode is "compose" (not "reply")
6. ✅ User can manually write or use AI tools in the composer

## Changes Made

**File: `src/components/email/ReplyLaterStackWrapper.tsx`**

### 1. Simplified `handleOpenFull` function

**Before:**

```typescript
const handleOpenFull = async (email: Email): Promise<void> => {
  setSelectedEmail(email);
  setIsGeneratingDraft(true);

  const toastId = toast.loading('Writing your response now...');

  // Try to get existing AI reply or generate a new draft
  let draft = email.aiReply || '';

  if (!draft) {
    try {
      const result = await generateReplyDraft(email.id);
      if (result.success && result.draftContent) {
        draft = result.draftContent;
        toast.success('Response ready!', { id: toastId });
      } else {
        // Error handling...
      }
    } catch (error) {
      // Error handling...
    }
  } else {
    toast.success('Response ready!', { id: toastId });
  }

  setSelectedDraft(draft);
  setIsGeneratingDraft(false);
  setComposerOpen(true);
};
```

**After:**

```typescript
const handleOpenFull = async (email: Email): Promise<void> => {
  // Simply open the composer with the recipient pre-filled
  // User can manually write or use AI tools within the composer
  setSelectedEmail(email);
  setComposerOpen(true);
};
```

### 2. Updated EmailComposer props

**Before:**

```typescript
<EmailComposer
  isOpen={composerOpen}
  onClose={handleComposerClose}
  onSent={handleEmailSent}
  mode="reply"
  initialData={{
    to: selectedEmail.fromAddress.email,        // ❌ Wrong property
    subject: `Re: ${selectedEmail.subject}`,    // ❌ Auto-filled
    body: selectedDraft,                        // ❌ AI draft
  }}
  isAIDraft={true}                              // ❌ Not needed
  replyLaterEmailId={selectedEmail.id}
/>
```

**After:**

```typescript
<EmailComposer
  isOpen={composerOpen}
  onClose={handleComposerClose}
  onSent={handleEmailSent}
  mode="compose"                                // ✅ Compose mode
  initialData={{
    to: selectedEmail.fromAddress?.address || '', // ✅ Correct property
    subject: '',                                  // ✅ Empty
    body: '',                                     // ✅ Empty
  }}
  replyLaterEmailId={selectedEmail.id}
/>
```

### 3. Removed unused code

- Removed `generateReplyDraft` import
- Removed `selectedDraft` state variable
- Removed `isGeneratingDraft` state variable
- Removed all AI draft generation logic
- Removed `isAIDraft` prop

## User Workflow

1. User marks an email as "Reply Later"
2. Email appears as bubble at bottom of screen
3. User clicks bubble
4. Composer opens instantly with:
   - ✅ To: sender's email address
   - ✅ Subject: (empty - user types)
   - ✅ Body: (empty - user types or uses AI tools)
5. User can:
   - Type manually
   - Click "AI Writer" button in composer
   - Use any other composer tools
6. Send email → Removes from Reply Later stack

## Benefits

1. **Faster**: No waiting for AI generation
2. **Simpler**: Clear, predictable behavior
3. **Flexible**: User chooses manual writing OR AI tools
4. **No errors**: No AI API failures blocking the composer
5. **Correct data**: Uses `fromAddress.address` instead of non-existent `.email`

## Files Modified

- `src/components/email/ReplyLaterStackWrapper.tsx` - Simplified behavior, removed AI auto-generation

---

**Date:** 2025-10-19  
**Status:** ✅ Complete
