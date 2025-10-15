<!-- 3b1fe3bd-8b79-4c80-b3f3-bf8eae85637f 12339f11-ee56-410b-9a9b-c4dc66d843d7 -->
# Custom Folder Feature for Screener

## Overview

Add custom folder functionality allowing users to create personalized email destinations. Users can quick-add folders in the screener or manage them fully in settings. Custom folders appear in sidebar and are user-specific.

## Database Changes

### 1. Create `custom_folders` table in `src/db/schema.ts`

Add new table after `emailSettings`:

```typescript
export const customFolders = pgTable('custom_folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  icon: text('icon').default('📁'), // emoji or icon name
  color: varchar('color', { length: 20 }).default('gray'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('custom_folders_user_id_idx').on(table.userId),
  userNameIdx: index('custom_folders_user_name_idx').on(table.userId, table.name),
}));
```

### 2. Update `emails` table

Add custom folder reference:

```typescript
customFolderId: uuid('custom_folder_id').references(() => customFolders.id, { onDelete: 'set null' }),
```

### 3. Add TypeScript type export

```typescript
export type CustomFolder = typeof customFolders.$inferSelect;
```

## Server Actions

### 4. Create `src/lib/folders/actions.ts`

```typescript
'use server';

// CRUD operations:
// - createCustomFolder(userId, name, icon?, color?)
// - updateCustomFolder(folderId, updates)
// - deleteCustomFolder(folderId)
// - getUserCustomFolders(userId)
// - reorderCustomFolders(userId, folderIds[])
```

### 5. Create `src/lib/folders/data.ts`

```typescript
// Data fetching:
// - getCustomFolderById(folderId)
// - getCustomFoldersForUser(userId)
// - getEmailCountByFolder(userId, folderId)
```

## Settings Component

### 6. Create `src/components/settings/FolderSettings.tsx`

- Display list of custom folders with name, icon, color
- Add/edit/delete folder UI
- Drag-and-drop reordering
- Emoji picker for icons
- Color picker (preset colors)
- Validation (max 20 folders, unique names per user)

### 7. Update `src/app/dashboard/settings/page.tsx`

Add "Folders" tab to settings navigation:

```typescript
{ id: 'folders', label: 'Custom Folders', icon: Folder, description: 'Manage your custom folders' }
```

## Screener Updates

### 8. Update `src/components/screener/ScreenerCard.tsx`

- Fetch user's custom folders
- Display 4 default buttons (Imbox, Feed, Paper Trail, Block) in first row
- If custom folders exist, add scrollable second row below
- Add "+" button to create new folder on-the-fly
- Modal for quick folder creation (name + optional icon/color)

### 9. Update screener decision handler

Modify `handleDecision` to accept both:

- Default destinations: 'imbox' | 'feed' | 'paper_trail' | 'block'
- Custom folder ID: string (UUID)

Update `src/app/dashboard/screener/page.tsx` to handle custom folder routing.

## Sidebar Updates

### 10. Update `src/components/layout/Sidebar.tsx`

After "Folders" section, add "Custom Folders" section:

- Fetch and display user's custom folders
- Show folder icon, name, and email count badge
- Link to `/dashboard/folder/[folderId]`
- Add "Manage Folders" link at bottom

## Dynamic Routes

### 11. Create `src/app/dashboard/folder/[folderId]/page.tsx`

- Dynamic route for custom folder views
- Fetch folder details and emails
- Reuse `EmailLayout` and `EmailList` components
- Filter emails by `customFolderId`

## Email Routing Logic

### 12. Create `src/lib/screener/routing.ts`

Handle screener decisions:

- Update `emailContacts` table with sender decision
- Route email to appropriate location (heyView or customFolderId)
- Apply rule to all future emails from same sender

## Validation & Constraints

- Max 20 custom folders per user
- Folder names must be unique per user (case-insensitive)
- Name length: 1-50 characters
- Cannot delete folder if it contains emails (must move/delete emails first)
- Icon: single emoji or preset icon name
- Color: predefined palette (8 colors)

### To-dos

- [ ] Add custom_folders table and update emails table in schema.ts
- [ ] Create folder CRUD actions and data fetching functions
- [ ] Build FolderSettings component and integrate into settings page
- [ ] Update ScreenerCard to show custom folders and quick-add modal
- [ ] Add custom folders section to Sidebar with folder list
- [ ] Create dynamic folder route and email filtering logic
- [ ] Implement screener decision routing for custom folders