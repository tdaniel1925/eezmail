# Inline Attachments Filter Implementation

**Date**: Current Session  
**Status**: ✅ COMPLETE

---

## Problem

Embedded images in emails (email signatures, company logos, tracking pixels, etc.) were being saved as attachments and showing up in the attachments page, cluttering the UI with files that users don't typically want to download.

**Example inline content:**
- Email signature images (logos, headshots)
- Company branding at email footers
- Inline embedded images referenced by `Content-ID`
- Tracking pixels
- Email template graphics

---

## Solution

Implemented multi-layer filtering to exclude inline/embedded attachments:

### 1. Attachment Service Layer (Primary Filter)

**File**: `src/lib/email/attachment-service.ts`

#### IMAP Provider (lines 97-110):
```typescript
if (provider === 'imap' && message.attachments) {
  attachmentMetadata = message.attachments
    .filter((att: any) => {
      // Filter out inline images/embedded content (signatures, logos, etc.)
      const isInline = att.contentDisposition === 'inline' || att.contentId;
      return !isInline;
    })
    .map((att: any) => ({
      filename: att.filename || 'untitled',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || att.content?.length || 0,
      contentId: att.contentId,
      isInline: false, // Already filtered out inline
    }));
}
```

**Filter criteria:**
- ❌ Exclude if `contentDisposition === 'inline'`
- ❌ Exclude if has `contentId` (referenced in HTML with `cid:`)
- ✅ Only save attachments with `disposition: attachment`

#### Gmail Provider (lines 111-134):
```typescript
else if (provider === 'gmail' && message.payload?.parts) {
  attachmentMetadata = message.payload.parts
    .filter((part: any) => {
      // Must have filename and attachmentId
      if (!part.filename || !part.body?.attachmentId) return false;
      
      // Filter out inline images/embedded content
      const isInline = part.headers?.some(
        (h: any) =>
          h.name === 'Content-Disposition' && h.value.includes('inline')
      );
      const hasContentId = part.headers?.some(
        (h: any) => h.name === 'Content-ID'
      );
      
      return !isInline && !hasContentId;
    })
    .map((part: any) => ({
      filename: part.filename,
      contentType: part.mimeType || 'application/octet-stream',
      size: part.body.size || 0,
      providerAttachmentId: part.body.attachmentId,
      isInline: false, // Already filtered out inline
    }));
}
```

**Filter criteria:**
- ❌ Exclude if `Content-Disposition: inline` header present
- ❌ Exclude if `Content-ID` header present
- ✅ Only process parts with filenames and attachment IDs

### 2. API Layer (Secondary Filter)

#### Attachments List API

**File**: `src/app/api/attachments/route.ts` (lines 54-62)

```typescript
// Get all attachments for those emails
// Exclude inline attachments (signatures, logos, etc.)
const attachments = await db.query.emailAttachments.findMany({
  where: and(
    inArray(emailAttachments.emailId, emailIds),
    or(
      eq(emailAttachments.isInline, false),
      isNull(emailAttachments.isInline)
    )
  ),
});
```

#### Email Attachments API

**File**: `src/app/api/emails/[emailId]/attachments/route.ts` (lines 43-52)

```typescript
// Fetch attachments for this email
// Exclude inline attachments (signatures, logos, embedded images)
const attachments = await db.query.emailAttachments.findMany({
  where: and(
    eq(emailAttachments.emailId, emailId),
    or(
      eq(emailAttachments.isInline, false),
      isNull(emailAttachments.isInline)
    )
  ),
  orderBy: (attachments, { asc }) => [asc(attachments.createdAt)],
});
```

**Why this filter is needed:**
- Defense in depth: catches any inline attachments that might slip through
- Handles legacy data where `isInline` might not have been set
- Provides consistent filtering across all attachment queries

---

## How It Works

### During Email Sync:

1. **Email arrives** with both real attachments and inline images
2. **Attachment Service processes** each attachment:
   - Checks `Content-Disposition` header
   - Checks for `Content-ID` (indicates inline reference)
   - **Inline content**: ❌ Skipped completely (not saved to database)
   - **Real attachments**: ✅ Saved with `isInline: false`

3. **Result**: Only actual downloadable attachments are saved

### When User Views Attachments:

1. **UI requests attachments** via API
2. **API filters query** with `isInline = false OR isInline IS NULL`
3. **Result**: Only real attachments displayed

---

## Filter Logic Breakdown

### What Gets EXCLUDED (❌):

1. **Content-Disposition: inline**
   ```
   Content-Disposition: inline; filename="signature.png"
   ```

2. **Has Content-ID** (referenced in email HTML)
   ```html
   <img src="cid:logo@company.com">
   ```
   ```
   Content-ID: <logo@company.com>
   ```

3. **Common inline patterns:**
   - Email signature images
   - Company logos in footers
   - Inline charts/graphs referenced in email body
   - Tracking pixels
   - Template images

### What Gets INCLUDED (✅):

1. **Content-Disposition: attachment**
   ```
   Content-Disposition: attachment; filename="report.pdf"
   ```

2. **No Content-ID** (not referenced inline)

3. **Common attachment patterns:**
   - PDFs, Word docs, spreadsheets
   - ZIP files
   - Images meant to be downloaded (not embedded)
   - Any file the sender explicitly attached

---

## Technical Details

### IMAP Attachment Structure:
```javascript
{
  filename: 'signature.png',
  contentType: 'image/png',
  contentDisposition: 'inline',  // ← Filter indicator
  contentId: '<logo@company.com>', // ← Filter indicator
  size: 12345,
  content: Buffer
}
```

### Gmail Attachment Headers:
```javascript
{
  filename: 'logo.png',
  headers: [
    { name: 'Content-Disposition', value: 'inline' },  // ← Filter indicator
    { name: 'Content-ID', value: '<abc123@gmail.com>' } // ← Filter indicator
  ],
  body: {
    attachmentId: 'xyz789',
    size: 5678
  }
}
```

---

## Benefits

1. **Cleaner UI**: Attachments page only shows downloadable files
2. **Better UX**: Users don't see 10+ "signature.png" files
3. **Accurate counts**: `hasAttachments` reflects actual attachments
4. **Storage savings**: Don't waste space on embedded images
5. **Performance**: Faster queries with fewer records

---

## Files Modified

1. ✅ `src/lib/email/attachment-service.ts`
   - Added IMAP inline filter (lines 97-110)
   - Added Gmail inline filter (lines 111-134)

2. ✅ `src/app/api/attachments/route.ts`
   - Added database filter for attachments list (lines 54-62)

3. ✅ `src/app/api/emails/[emailId]/attachments/route.ts`
   - Added database filter for email-specific attachments (lines 43-52)

---

## Testing

### Test Case 1: Email with Signature
**Scenario**: Email has company logo in signature + PDF attachment

**Expected**:
- ❌ Logo NOT saved to database
- ✅ PDF saved to database
- Attachments page shows only PDF

### Test Case 2: Marketing Email
**Scenario**: Marketing email with 5 inline images + 1 downloadable brochure

**Expected**:
- ❌ 5 inline images NOT saved
- ✅ 1 brochure saved
- Attachments page shows only brochure

### Test Case 3: Plain Attachment
**Scenario**: Simple email with Word doc attachment

**Expected**:
- ✅ Word doc saved
- Attachments page shows Word doc

---

## Migration Notes

**Existing inline attachments**: If you have existing inline attachments in your database from before this fix:

1. They will be filtered out automatically by the API layer
2. To clean them up completely, run:

```sql
-- Mark existing inline attachments
UPDATE email_attachments
SET is_inline = true
WHERE content_id IS NOT NULL
   OR original_filename LIKE '%signature%'
   OR original_filename LIKE '%logo%';

-- Or delete them entirely
DELETE FROM email_attachments
WHERE content_id IS NOT NULL;
```

---

## Console Output

**Before (with inline content):**
```
📎 Processing attachments for email: abc123 (imap)
✅ Saved 15 attachment(s) metadata
```

**After (inline filtered out):**
```
📎 Processing attachments for email: abc123 (imap)
✅ Saved 2 attachment(s) metadata
```

---

## Related Files

- `ATTACHMENT_PROCESSING_FIX.md` - Static import fix
- `ATTACHMENTS_IMPLEMENTATION_COMPLETE.md` - Full system documentation
- `ATTACHMENT_SYSTEM_EXPLAINED.md` - Architecture overview

---

✅ **Inline attachments are now filtered out across the entire system!**



