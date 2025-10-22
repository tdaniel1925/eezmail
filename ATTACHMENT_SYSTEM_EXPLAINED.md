# 📎 Attachment System - Complete Overview

## 🔄 Current Architecture

### **System Flow**

```
User → Upload API → Base64 Encoding → Component State → Send Email → SMTP/IMAP
```

---

## 📂 Components

### **1. Frontend (EmailComposer)**

**File**: `src/components/email/EmailComposer.tsx`

**State Management**:

```typescript
const [attachments, setAttachments] = useState<Attachment[]>([]);

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data?: string; // Base64 encoded file
  url?: string; // Only for voice messages
  progress?: number; // Upload progress
  error?: string; // Error message
}
```

**User Actions**:

- Click paperclip button → triggers file picker
- Drag & drop files → `handleDrop()`
- Files automatically upload via `uploadFiles()`

---

### **2. Upload API**

**File**: `src/app/api/attachments/upload/route.ts`

**Process**:

1. Authenticate user (Supabase Auth)
2. Validate file size (max 25MB)
3. Validate file type:
   - Images (image/\*)
   - PDFs (application/pdf)
   - Word docs (application/msword, .docx)
   - Text files (text/\*)
   - ZIP files
4. Convert file → Base64
5. Return JSON with base64 data

**Response**:

```json
{
  "id": "1698765432-abc123",
  "name": "document.pdf",
  "size": 2048576,
  "type": "application/pdf",
  "data": "JVBERi0xLjQKJeLjz9MK..." // Base64
}
```

**⚠️ IMPORTANT**:

- Files are **NOT stored** anywhere
- Base64 data returned to frontend
- Stored only in component state (memory)

---

### **3. Sending Email**

**File**: `src/lib/email/send-email.ts`

**For IMAP/SMTP (Nodemailer)**:

```typescript
attachments: params.attachments?.map((att) => ({
  filename: att.filename,
  content: Buffer.from(att.content, 'base64'), // Convert base64 → Buffer
  contentType: att.contentType,
}));
```

**For Gmail API**:

- Would need to create MIME multipart message
- Not currently implemented

**For Microsoft Graph**:

- Would POST to `/me/messages/{id}/attachments`
- Not currently implemented

---

## 🎤 Voice Messages (Different System)

Voice messages use **Supabase Storage** for persistent storage:

### **Process**:

1. Record voice → Compress to MP3 (client-side with lamejs)
2. Upload to `/api/voice-message/upload`
3. Store in **Supabase Storage** bucket: `voice-messages`
4. Return public URL
5. When sending email:
   - Fetch from URL
   - Convert to base64
   - Attach to email

**Storage Path**: `userId/timestamp-random.mp3`

---

## 📊 Database Schema

### **Table: `email_attachments`**

**File**: `src/db/schema.ts`

```sql
CREATE TABLE email_attachments (
  id UUID PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES emails(id),

  -- Provider IDs
  provider_attachment_id TEXT,
  content_id TEXT,

  -- File metadata
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,

  -- Storage (for received emails)
  storage_url TEXT,
  storage_key TEXT,

  -- Inline attachments
  is_inline BOOLEAN DEFAULT FALSE,

  -- Download tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Store metadata for attachments in **received** emails.

---

## ✅ What Works

### **Outgoing Emails (Sending)**:

- ✅ Upload files via UI
- ✅ Multiple attachments
- ✅ Progress indicators
- ✅ File type validation
- ✅ Size limit (25MB)
- ✅ Base64 encoding
- ✅ Works with SMTP/IMAP
- ✅ Voice messages with Supabase Storage

### **Incoming Emails (Received)**:

- ✅ Database table exists for metadata
- ✅ Schema supports storage URLs
- ✅ `hasAttachments` flag is set correctly during sync
- ❌ **Attachment files NOT downloaded**
- ❌ **Attachment metadata NOT saved to database**
- ❌ **No way to view/download attachments in UI**

---

## 📥 Incoming Attachments (Detailed Analysis)

### **Current Sync Behavior**

When syncing emails from IMAP/Gmail/Microsoft, the system:

1. ✅ **Detects** attachments exist (`hasAttachments: true`)
2. ❌ **Does NOT download** attachment files
3. ❌ **Does NOT save** to `email_attachments` table
4. ❌ **Does NOT store** in Supabase Storage

### **Available Data (Not Being Used)**

#### **IMAP (via mailparser)**:

`mailparser` provides full attachment data in `parsed.attachments[]`:

```typescript
parsed.attachments.forEach((att) => {
  // Available properties:
  att.filename; // "document.pdf"
  att.contentType; // "application/pdf"
  att.size; // File size in bytes
  att.content; // Buffer with file data
  att.contentId; // For inline images
  att.contentDisposition; // "attachment" or "inline"
});
```

**⚠️ Currently**: We check `(parsed.attachments?.length || 0) > 0` but **don't save** the attachments.

#### **Gmail API**:

Gmail provides attachment metadata in message payload:

```typescript
// In messageDetails.payload.parts[]
parts.forEach((part) => {
  if (part.filename && part.body.attachmentId) {
    // Need separate API call to get content:
    // GET /messages/{messageId}/attachments/{attachmentId}
  }
});
```

**⚠️ Currently**: We check for filenames but **don't fetch** attachment content.

#### **Microsoft Graph**:

Microsoft provides attachments endpoint:

```typescript
// GET /me/messages/{messageId}/attachments
// Returns array of attachments with:
{
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes: string; // Base64 encoded
}
```

**⚠️ Currently**: We check `message.hasAttachments` but **don't fetch** attachments.

### **What Needs to Be Implemented**

#### **For IMAP**:

```typescript
// In syncWithImap() after inserting email:
if (parsed.attachments && parsed.attachments.length > 0) {
  for (const att of parsed.attachments) {
    // 1. Upload to Supabase Storage
    const { data } = await supabase.storage
      .from('email-attachments')
      .upload(`${userId}/${emailId}/${att.filename}`, att.content, {
        contentType: att.contentType,
      });

    // 2. Save metadata to database
    await db.insert(emailAttachments).values({
      emailId: emailId,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      storageUrl: publicUrl,
      storageKey: data.path,
      isInline: att.contentDisposition === 'inline',
    });
  }
}
```

#### **For Gmail API**:

```typescript
// After fetching message details:
if (messageDetails.payload.parts) {
  for (const part of messageDetails.payload.parts) {
    if (part.filename && part.body.attachmentId) {
      // Fetch attachment content
      const attachment = await gmail.getAttachment(
        messageDetails.id,
        part.body.attachmentId
      );

      // Convert base64 to Buffer
      const buffer = Buffer.from(attachment.data, 'base64');

      // Upload to Supabase + save metadata (same as IMAP)
    }
  }
}
```

#### **For Microsoft Graph**:

```typescript
// After inserting email:
const response = await fetch(
  `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const { value: attachments } = await response.json();

for (const att of attachments) {
  const buffer = Buffer.from(att.contentBytes, 'base64');
  // Upload to Supabase + save metadata (same as IMAP)
}
```

---

## ❌ Current Limitations

### **1. No Persistent Storage for Outgoing Attachments**

- Files converted to base64 immediately
- Stored only in component state
- Lost if page refreshes before sending
- Memory-intensive for large files

### **2. No Draft Attachment Storage**

- If you save a draft, attachments are lost
- Drafts table doesn't store attachments

### **3. No Attachment Management**

- Can't browse sent attachments
- No attachment history
- No attachment search

### **4. Large File Issues**

- 25MB files → huge base64 strings
- Can cause browser memory issues
- No chunked upload

### **5. Incomplete Provider Integration**

- Gmail API: Not implemented
- Microsoft Graph: Not implemented
- Only works fully with SMTP

---

## 🔮 Recommended Improvements

### **Priority 1: Persistent Storage**

Use Supabase Storage like voice messages:

```typescript
// 1. Upload to Supabase Storage
const { data } = await supabase.storage
  .from('email-attachments')
  .upload(`${userId}/${timestamp}-${filename}`, file);

// 2. Store URL + metadata in component state
setAttachments([
  ...attachments,
  {
    id: data.path,
    name: file.name,
    size: file.size,
    type: file.type,
    url: publicUrl,
    storageKey: data.path,
  },
]);

// 3. When sending: fetch from URL → base64 → attach
// (Same as voice messages)
```

### **Priority 2: Draft Support**

Store attachment references in drafts:

```sql
ALTER TABLE email_drafts
ADD COLUMN attachment_keys TEXT[]; -- Array of storage keys
```

### **Priority 3: Received Email Attachments**

- Parse attachments from IMAP/Graph/Gmail
- Store in Supabase Storage
- Save metadata to `email_attachments` table
- Display in email viewer

### **Priority 4: Chunked Uploads**

- For files > 5MB
- Upload in chunks
- Better progress tracking
- Resume capability

---

## 📝 Summary

| Feature         | Outgoing           | Incoming                    |
| --------------- | ------------------ | --------------------------- |
| Upload UI       | ✅ Works           | N/A                         |
| Detection       | N/A                | ✅ hasAttachments flag set  |
| Storage         | ❌ Memory only     | ❌ Not downloaded           |
| Database        | ❌ No              | ❌ Table exists but empty   |
| SMTP/IMAP       | ✅ Works           | ❌ Data available, not used |
| Gmail API       | ❌ Not implemented | ❌ Data available, not used |
| MS Graph        | ❌ Not implemented | ❌ Data available, not used |
| Draft support   | ❌ No              | N/A                         |
| File management | ❌ No              | ❌ No                       |
| UI Display      | ✅ Shows in list   | ❌ No viewer                |

---

## 🎯 Quick Fix for Persistence

Want to quickly add persistent storage? Follow the voice message pattern:

1. Create Supabase Storage bucket: `email-attachments`
2. Update `src/app/api/attachments/upload/route.ts` to upload to Supabase
3. Return URL instead of base64
4. Update `handleSend()` to fetch from URL before sending

This would:

- ✅ Survive page refreshes
- ✅ Support drafts
- ✅ Reduce memory usage
- ✅ Enable attachment history

---

**Current Status**: System works for basic attachment sending via SMTP but lacks persistence and advanced features.
