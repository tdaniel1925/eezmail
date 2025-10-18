# Right Sidebar Tabs - Integration Guide

## Quick Start

The new right sidebar tabs system is ready to use! Here's how to integrate it into your email application.

## Setting Current Email (When Email is Clicked)

When a user clicks an email in the email list, you need to update the AI Panel store with the email context.

### Example: Email List Component

```typescript
// In your email list component (e.g., src/components/email/EmailList.tsx)
'use client';

import { useAIPanelStore } from '@/stores/aiPanelStore';

export function EmailListItem({ email }: { email: YourEmailType }) {
  const { setCurrentEmail } = useAIPanelStore();

  const handleEmailClick = () => {
    // Set the email in the AI panel
    setCurrentEmail({
      id: email.id,
      subject: email.subject,
      from: email.fromAddress,
      to: email.toAddresses[0], // or join multiple addresses
      body: email.bodyText,
      timestamp: email.receivedAt,
      threadId: email.threadId,
    });

    // Your existing email click logic...
  };

  return (
    <div onClick={handleEmailClick} className="...">
      {/* Email list item UI */}
    </div>
  );
}
```

### What Happens Automatically

When you call `setCurrentEmail()`:

1. ✅ The email is stored in the AI panel state
2. ✅ The sidebar automatically switches to the "AI Assistant" tab
3. ✅ The "Thread Summary" tab becomes enabled
4. ✅ The Assistant tab shows email-context sections (quick actions, contact stats)

## Clearing Email Context

When no email is selected (e.g., user clicks elsewhere):

```typescript
const { setCurrentEmail } = useAIPanelStore();

// Clear the current email
setCurrentEmail(null);
```

This will:

- Reset the Assistant tab to full-chat mode
- Disable the Thread Summary tab
- Hide email-specific quick actions

## Switching Tabs Programmatically

You can manually switch tabs if needed:

```typescript
const { setActiveTab } = useAIPanelStore();

// Switch to a specific tab
setActiveTab('thread'); // 'assistant' | 'thread' | 'actions' | 'contacts'
```

## Accessing Current State

Read the current sidebar state anywhere in your app:

```typescript
const {
  activeTab, // Current active tab
  currentEmail, // Currently selected email (or null)
  selectedContactId, // Selected contact ID (or null)
  isExpanded, // Whether sidebar is expanded
} = useAIPanelStore();
```

## Example: Full Integration

Here's a complete example showing integration in an email viewer:

```typescript
'use client';

import { useAIPanelStore } from '@/stores/aiPanelStore';
import { useEffect } from 'react';

interface EmailViewerProps {
  emailId: string;
  email: {
    id: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    timestamp: Date;
    threadId: string;
  };
}

export function EmailViewer({ emailId, email }: EmailViewerProps) {
  const { setCurrentEmail, setExpanded } = useAIPanelStore();

  // Update AI panel when email changes
  useEffect(() => {
    setCurrentEmail({
      id: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      body: email.body,
      timestamp: email.timestamp,
      threadId: email.threadId,
    });

    // Optionally auto-expand the sidebar
    setExpanded(true);

    // Cleanup when component unmounts
    return () => {
      setCurrentEmail(null);
    };
  }, [emailId, email, setCurrentEmail, setExpanded]);

  return (
    <div className="email-viewer">
      <h1>{email.subject}</h1>
      <p>From: {email.from}</p>
      <div dangerouslySetInnerHTML={{ __html: email.body }} />
    </div>
  );
}
```

## Contact Actions Tab Integration

To use the Contact Actions tab effectively:

```typescript
// Select a contact for actions
const { setSelectedContact } = useAIPanelStore();

setSelectedContact('contact-id-123');

// Switch to contacts tab
setActiveTab('contacts');
```

## Database Migration

Don't forget to apply the database migration:

```bash
# Using psql
psql -U your_user -d your_database -f migrations/20251018020115_add_contact_timeline_notes.sql

# Or using Drizzle Kit
npx drizzle-kit push:pg
```

## API Integration Points (To Be Implemented)

The following components have `// TODO` comments where you need to add API integration:

### Chat Interface

- File: `src/components/ai/tabs/assistant/ChatInterface.tsx`
- API: `/api/chat` (already integrated, just needs to return actual responses)

### Email Quick Actions

- File: `src/components/ai/tabs/assistant/EmailQuickActions.tsx`
- Actions needed:
  - Reply/Forward: Open email composer with context
  - Archive/Delete: Update email status
  - AI actions: Call AI endpoints for generation

### Contact Stats

- File: `src/components/ai/tabs/assistant/ContactStats.tsx`
- API: Create `/api/contacts/[id]/stats` to fetch real contact data

### Thread Summary

- File: `src/components/ai/tabs/ThreadSummaryTab.tsx`
- API: Create `/api/ai/thread-analysis` to analyze threads

### Contact Actions

- File: `src/components/ai/tabs/ContactActionsTab.tsx`
- APIs:
  - `/api/contacts/search` - Search contacts
  - `/api/contacts/[id]/timeline` - Get timeline events
  - `/api/contacts/[id]/notes` - CRUD operations for notes

## Styling Customization

The sidebar uses your existing design system:

- Primary color: `#FF4C5A` (as defined in your cursor rules)
- Dark mode: Fully supported via Tailwind's `dark:` classes
- Responsive: Automatically hides on mobile

To customize tab colors or spacing, edit:

- `src/components/ai/TabNavigation.tsx` - Tab navigation styles
- `src/components/ai/AIAssistantPanelNew.tsx` - Panel container styles

## Keyboard Shortcuts (Optional Enhancement)

You can add keyboard shortcuts for tab switching:

```typescript
// Example: Add to your keyboard shortcuts provider
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          setActiveTab('assistant');
          break;
        case '2':
          setActiveTab('thread');
          break;
        case '3':
          setActiveTab('actions');
          break;
        case '4':
          setActiveTab('contacts');
          break;
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [setActiveTab]);
```

## Troubleshooting

### Tab not switching

- Check that you're calling `setActiveTab()` with a valid tab type
- Verify the AI panel is visible and expanded

### Thread Summary tab disabled

- Ensure you've called `setCurrentEmail()` with a valid email object
- Check that `email.id` is not null or undefined

### Contact stats showing mock data

- This is expected! Replace the mock data in `ContactStats.tsx` with real API calls

### Chat not responding

- The chat is integrated with `/api/chat` - ensure this endpoint is working
- Check browser console for API errors

## Next Steps

1. ✅ Database migration applied
2. ✅ Components created and integrated
3. ✅ Layout updated to use new panel
4. ⏳ Set email context on email clicks
5. ⏳ Implement API endpoints for real data
6. ⏳ Add action handlers (reply, forward, etc.)
7. ⏳ Implement contact timeline logging

See `RIGHT_SIDEBAR_TABS_IMPLEMENTATION.md` for full implementation details.
