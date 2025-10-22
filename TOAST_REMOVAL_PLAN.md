# Toast Removal Plan - Remove All Non-Error Toasts

**Goal**: Remove all `toast.success()`, `toast.info()`, `toast.loading()`, and `toast.warning()` calls, keeping only `toast.error()`.

## Strategy

Remove toasts from these categories:

### 1. Email Actions (High Priority) ✅
- EmailList.tsx - Mark as spam, archive, delete, move to folder
- EmailViewer.tsx - Reply later, set aside, mark important  
- EmailComposer.tsx - Draft saved, email sent, template applied
- ReplyLaterStackWrapper.tsx - Reply later added/removed

### 2. Sync Operations
- SyncButton.tsx - Manual sync triggered
- SyncDashboard.tsx - Sync completed
- SyncControlPanel.tsx - Sync started/stopped

### 3. Settings & Preferences  
- ConnectedAccounts.tsx - Account added/removed
- FolderSettings.tsx - Folder created/updated
- RulesSettings.tsx - Rule created/updated
- SignaturesSettings.tsx - Signature saved

### 4. Contact Operations
- ContactFormModal.tsx - Contact saved
- BulkActions.tsx - Bulk operations completed
- TagManager.tsx - Tags updated

### 5. Other Components
- AI panels - Various AI operations
- Attachments - Upload/download
- Templates - Applied/saved

## Files to Modify (59 total)

Will process in batches of 10-15 files at a time.

