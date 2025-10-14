# AI Email Client - Feature Requirements & Specifications

[← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)

---

## 📬 Core Feature Set

### 1. Email Account Management

#### 1.1 Multi-Provider Support

**Description:** Connect email accounts from any provider with OAuth or IMAP/SMTP.

**User Stories:**
- As a user, I want to connect my Gmail account with one click
- As a user, I want to connect my Microsoft 365 account seamlessly
- As a user, I want to add my custom domain email via IMAP/SMTP
- As a user, I want to manage multiple email accounts in one interface

**Technical Requirements:**
- OAuth 2.0 integration (Gmail, Microsoft)
- IMAP client with connection pooling
- SMTP client for sending
- AES-256-GCM encryption for credentials
- Token refresh automation
- Connection health monitoring

**Supported Providers:**
| Provider | Connection Type | Features |
|----------|----------------|----------|
| Gmail | OAuth 2.0 | Full API access, push notifications |
| Microsoft 365 | OAuth 2.0 | Graph API, webhooks |
| Yahoo Mail | IMAP/SMTP | Standard email operations |
| AOL Mail | IMAP/SMTP | Standard email operations |
| Custom Domain | IMAP/SMTP | Universal support |
| iCloud | IMAP/SMTP | App-specific passwords |

**UI Requirements:**
- "Add Account" button in settings
- Provider selection screen with logos
- OAuth flow in popup window
- IMAP/SMTP form with auto-detection
- Connection test with error messages
- Account list with status indicators

**Acceptance Criteria:**
- ✅ User can connect Gmail in < 30 seconds
- ✅ OAuth tokens automatically refresh
- ✅ IMAP credentials are encrypted at rest
- ✅ Connection errors show helpful messages
- ✅ Multiple accounts work simultaneously

---

### 2. Email Screening System

#### 2.1 The Screener

**Description:** All emails from new senders go to the Screener. User decides: Imbox (important), Feed (newsletters), Paper Trail (receipts), or Block.

**User Stories:**
- As a user, I want to screen new senders before they reach my inbox
- As a user, I want AI to suggest which category an email belongs to
- As a user, I want to block unwanted senders permanently
- As a user, I want previously screened senders to bypass the screener

**How It Works:**
```
New Email Arrives
  ↓
Is sender previously screened?
  ↓ NO
Sender goes to Screener
  ↓
User makes decision:
  → Imbox (Important people)
  → The Feed (Newsletters)
  → Paper Trail (Receipts)
  → Block (Never see again)
  ↓
All future emails from this sender auto-route
```

**AI Assistance:**
- **Bulk Email Detection:** Analyzes headers, unsubscribe links, sender patterns
- **Receipt Detection:** Identifies invoices, order confirmations, shipping notices
- **VIP Detection:** Recognizes domain patterns (colleagues, clients)
- **Confidence Score:** Shows AI certainty (0-100%)
- **Reasoning:** Explains why AI made the suggestion

**UI Requirements:**
- Card-based interface (one sender at a time)
- Four large buttons: Imbox / Feed / Paper Trail / Block
- AI suggestion badge with confidence
- Email preview (subject, snippet, sender info)
- "View all emails from sender" link
- Smooth card animations (slide out on decision)
- Badge counter showing pending screenings

**Smart Features:**
- **2-Week Auto-Classification:** Emails older than 2 weeks are auto-classified by AI
- **Bulk Screening:** Select multiple senders, apply decision to all
- **Screening History:** See past decisions, undo if needed
- **Domain-Level Decisions:** Apply to all emails from @company.com

**Acceptance Criteria:**
- ✅ Only unscreened senders appear in Screener
- ✅ Decision routes all future emails automatically
- ✅ AI suggestion accuracy > 80%
- ✅ Card animations are smooth (60 FPS)
- ✅ Can screen 50 senders in < 5 minutes

---

### 3. Three Main Views

#### 3.1 Imbox (Important Mail)

**Description:** Only emails from people you've explicitly approved. The truly important mail.

**Philosophy:**
- Zero tolerance for noise
- Every email deserves attention
- VIP contacts only
- Personal and important work

**UI Features:**
- Clean, spacious email cards
- Prominent sender names
- Read/unread states
- Starred emails at top
- Thread grouping
- Keyboard navigation (j/k)

**Smart Features:**
- **VIP Badges:** Visual indicators for key contacts
- **SLA Warnings:** Highlights emails pending response > 24 hours
- **Smart Priority:** AI sorts by importance, not chronology
- **Focus Mode:** Hide everything except Imbox

**User Actions:**
- Reply / Reply All / Forward
- Reply Later (snooze with intent)
- Set Aside (temporary parking)
- Archive (done, remove from view)
- Delete (move to trash)

#### 3.2 The Feed (Newsletters & Updates)

**Description:** Newsletters, marketing emails, bulk notifications. Read when you have time.

**Philosophy:**
- Not spam, but not urgent
- Batch reading mode
- Quick mark all as read
- Unsubscribe easily

**UI Features:**
- Compact card layout (more per screen)
- "Mark All Read" button at top
- One-click unsubscribe
- Sender grouping
- Date filtering (Today, This Week, Older)

**Smart Features:**
- **Bulk Email Detection:** Automatically identifies newsletters via headers, patterns
- **Unsubscribe Integration:** One-click unsubscribe (calls List-Unsubscribe header)
- **Read Later:** Save to reading list
- **Category Tags:** Auto-tags (Tech News, Marketing, Finance)

**Acceptance Criteria:**
- ✅ 80%+ of newsletters auto-routed to Feed
- ✅ Mark all read affects 100+ emails instantly
- ✅ Unsubscribe works for 90%+ of newsletters
- ✅ Can process 50 feed emails in < 2 minutes

#### 3.3 Paper Trail (Receipts & Transactions)

**Description:** Receipts, invoices, shipping confirmations, transactional emails. Searchable archive.

**Philosophy:**
- Don't clutter Imbox
- Need to find later
- Searchable by order number, amount, vendor
- Financial records

**UI Features:**
- Search-first interface
- Filters (Date, Sender, Amount, Type)
- Attachment preview (PDF receipts)
- Export to CSV
- Monthly summaries

**Smart Features:**
- **Receipt Detection:** Identifies invoices, order confirmations, shipping notices
- **Data Extraction:** Pulls order numbers, amounts, dates, tracking numbers
- **Duplicate Detection:** Flags duplicate receipts
- **Expense Tagging:** Auto-categorizes for accounting

**Search Capabilities:**
```typescript
// Example queries that work:
"Amazon orders last month"
"Invoices over $500"
"Shipping confirmations this week"
"Order #123456"
"Receipts from Uber"
```

**Acceptance Criteria:**
- ✅ 90%+ of receipts auto-routed to Paper Trail
- ✅ Search returns results in < 500ms
- ✅ Can export month of receipts to CSV
- ✅ Attachment previews load quickly

---

### 4. AI-Powered Features

#### 4.1 Instant AI Summary (Hover)

**Description:** Hover over any email card for 400ms to see AI-generated summary, quick replies, and contextual actions.

**User Stories:**
- As a user, I want to understand an email without opening it
- As a user, I want AI-suggested quick replies
- As a user, I want contextual actions based on email content

**How It Works:**
```
User hovers over email card (400ms)
  ↓
Popup appears with:
  1. AI Summary (2-3 sentences)
  2. Quick Reply Suggestions (3 options)
  3. Related Emails (same sender, last 7 days)
  4. Smart Actions (contextual buttons)
  5. Thread Context (if part of conversation)
  ↓
User clicks quick reply → Composer pre-fills
User clicks action → Action executes
User clicks related email → Opens that email
```

**AI Summary Features:**
- **Pre-Generated:** AI runs in background when email arrives (< 1 second to generate)
- **Instant Loading:** Reads from cache (< 50ms)
- **Smart Caching:** Cached for 24 hours, regenerates if stale
- **Context-Aware:** Considers thread history, sender relationship
- **Confidence Score:** Shows AI certainty

**Quick Reply Suggestions:**
```typescript
// Example suggestions based on email type:

Question Email:
  → "Yes, happy to help with that!"
  → "Let me check and get back to you."
  → "Unfortunately, I can't assist with this."

Meeting Request:
  → "That time works for me!"
  → "Can we do [alternative time] instead?"
  → "Let me check my calendar and confirm."

Information Email:
  → "Thanks for the update!"
  → "Got it, will review."
  → "Looks good!"
```

**Smart Actions:**
```typescript
// Contextual actions based on email content:

Contains date/time → "Schedule Meeting"
Mentions task/action → "Add to Tasks"
Requires follow-up → "Set Reminder"
Has question → "Draft Reply"
Has attachment → "Save to Files"
Mentions price/invoice → "Add to Expenses"
```

**UI Requirements:**
- Popup positioned near cursor (not blocking email)
- Max width: 400px
- Smooth fade-in animation (200ms)
- Closes on mouse leave (300ms delay)
- Works on mobile (long press)
- Loading skeleton while fetching
- Error fallback (rule-based suggestions)

**Performance Requirements:**
- Popup appears in < 100ms after hover
- AI summary loads in < 200ms (from cache)
- Pre-generation completes in < 1 second
- Batch generates for 20 visible emails
- Never blocks UI thread

**Acceptance Criteria:**
- ✅ Hover delay feels instant (< 500ms total)
- ✅ AI summary is accurate and helpful
- ✅ Quick replies are relevant 80%+ of the time
- ✅ Smart actions match email content
- ✅ Works smoothly with 50+ emails on screen

#### 4.2 AI Email Copilot Panel

**Description:** Conversational AI assistant in sidebar. Understands context of selected email, suggests actions, helps compose replies.

**User Stories:**
- As a user, I want to ask questions about my emails
- As a user, I want AI to help me compose professional replies
- As a user, I want AI to extract action items from emails
- As a user, I want AI to summarize entire threads

**Capabilities:**

**1. Email Understanding**
```
User: "What is this email asking for?"
AI: "This email is requesting a status update on the Q4 report,
     specifically the sales figures for the West region. They need
     it by Friday."

User: "Has this person emailed me before?"
AI: "Yes, Sarah has sent you 12 emails in the past 3 months,
     primarily about quarterly reports and team updates."
```

**2. Reply Assistance**
```
User: "Help me decline this meeting politely"
AI: [Generates draft]
    "Thank you for the invitation! Unfortunately, I won't be able
     to attend due to a scheduling conflict. Would it be possible
     to get a summary of the key points discussed?"

User: "Make it more formal"
AI: [Adjusts tone]
    "Dear [Name], Thank you for extending the invitation..."
```

**3. Action Item Extraction**
```
User: "What do I need to do?"
AI: "Based on this email thread, you need to:
     1. Send the Q4 report by Friday, Dec 15
     2. Schedule a follow-up meeting with the sales team
     3. Review and approve the budget proposal"
```

**4. Thread Summarization**
```
User: "Summarize this thread"
AI: "This thread started on Nov 1 about the website redesign project.
     Key points:
     - Timeline: Launch by January 15
     - Budget approved: $50K
     - Waiting on: Final mockups from design team
     - Next step: Schedule kickoff meeting"
```

**5. Search & Find**
```
User: "Find all emails about the Johnson project"
AI: "I found 23 emails about the Johnson project. The most recent
     was 2 days ago from Mike updating you on the timeline delay.
     Would you like me to summarize the key updates?"
```

**UI Requirements:**
- Fixed right sidebar (420px width)
- Collapsible/expandable
- Chat interface (conversation history)
- Suggested prompts for current email
- Copy button for AI responses
- "Insert Reply" button (sends to composer)
- Context indicator (which email AI is analyzing)
- Typing indicators
- Message history (session-based)

**Technical Implementation:**
- OpenAI GPT-4o for natural language understanding
- Context injection (selected email + thread + sender history)
- Token optimization (summarize long threads)
- Streaming responses (progressive rendering)
- Error handling (graceful fallbacks)

**Acceptance Criteria:**
- ✅ Understands email context accurately
- ✅ Generates helpful, relevant responses
- ✅ Response time < 3 seconds
- ✅ Tone matching works correctly
- ✅ Action items are accurate 90%+ of the time

#### 4.3 AI-Powered Email Rules

**Description:** Visual rule builder with AI assistance. Automatically filter, label, and organize emails.

**User Stories:**
- As a user, I want to automatically label emails from my boss
- As a user, I want to archive all newsletters from specific senders
- As a user, I want AI to suggest rules based on my behavior
- As a user, I want to test rules before activating them

**Rule Structure:**
```typescript
IF [Conditions] → THEN [Actions]

// Example rule:
IF:
  - From: contains "@acme.com"
  - Subject: starts with "[URGENT]"
  - Has attachment: Yes
THEN:
  - Mark as important
  - Apply label: "Urgent Work"
  - Push notification
  - Move to Imbox
```

**Condition Types:**
| Condition | Operators | Example |
|-----------|-----------|---------|
| From | contains, equals, domain is | from:john@acme.com |
| To | contains, equals | to:team@company.com |
| Subject | contains, starts with, matches regex | subject:"Invoice" |
| Body | contains, matches regex | body:"urgent" |
| Has Attachment | is true/false | has_attachment:true |
| Date | before, after, between | date:last_7_days |
| Importance | is high/medium/low | importance:high |
| Label | has, doesn't have | label:"Work" |

**Action Types:**
| Action | Description | Example |
|--------|-------------|---------|
| Mark Read/Unread | Change read status | mark_as_read |
| Star/Unstar | Toggle star | star |
| Move to View | Route to Imbox/Feed/Paper Trail | move_to:imbox |
| Apply Label | Add custom label | label:"Clients" |
| Set Importance | Mark as important | set_importance:high |
| Forward | Auto-forward to address | forward:assistant@company.com |
| Auto-Reply | Send automated response | auto_reply:"Out of office" |
| Archive | Remove from Imbox | archive |
| Delete | Move to trash | delete |
| Run AI Task | Custom AI action | ai_task:"categorize" |

**AI Features:**

**1. Rule Suggestions:**
```
AI notices patterns in your behavior:

"You always archive emails from newsletter@medium.com.
 Would you like me to create a rule to automatically archive them?"
 [Create Rule] [Ignore]

"You've starred 5 emails from sarah@acme.com this week.
 Should I mark all her emails as important?"
 [Yes, Create Rule] [No Thanks]
```

**2. Natural Language Rule Creation:**
```
User: "Archive all emails from LinkedIn"
AI: [Creates rule]
    IF from:*@linkedin.com
    THEN archive

User: "Move newsletters to The Feed"
AI: "I'll create a rule to detect newsletters. Should I also include:
     - Emails with 'unsubscribe' links
     - Emails from no-reply addresses
     - Bulk email headers"
```

**3. Rule Testing:**
```
Before activating rule:
  ↓
Test against last 100 emails
  ↓
Show what would have happened:
  - "This rule would have affected 23 emails"
  - List affected emails
  - "15 archived, 8 labeled"
  ↓
User can approve or adjust
```

**UI Requirements:**
- Visual rule builder (drag & drop)
- Condition/action selector
- Natural language input option
- Rule list with enable/disable toggles
- Priority ordering (rules execute top-to-bottom)
- Test rule feature
- Rule statistics (how many emails affected)
- Import/export rules (JSON)

**Acceptance Criteria:**
- ✅ Can create rule in < 60 seconds
- ✅ Rules execute in real-time (< 100ms)
- ✅ AI suggestions are accurate and helpful
- ✅ Test feature shows accurate preview
- ✅ Complex rules (multiple conditions) work correctly

---

### 5. Email Composition & Sending

#### 5.1 Smart Composer

**Description:** Beautiful, distraction-free email composition with AI assistance.

**User Stories:**
- As a user, I want to compose emails quickly
- As a user, I want AI to help me write professional emails
- As a user, I want to use templates for common emails
- As a user, I want to schedule emails to send later

**Composition Features:**

**1. Rich Text Editor:**
- Bold, italic, underline, strikethrough
- Bullet lists, numbered lists
- Links, images
- Code blocks
- Tables
- Emoji picker
- Markdown support

**2. AI Writing Assistant:**
```
Tone Selector:
  → Professional (default)
  → Friendly
  → Formal
  → Casual
  → Brief

Length Selector:
  → Short (< 100 words)
  → Medium (100-250 words)
  → Long (> 250 words)

Actions:
  → "Improve Writing" - Fix grammar, improve clarity
  → "Change Tone" - Adjust formality level
  → "Expand" - Add more detail
  → "Shorten" - Make more concise
  → "Translate" - Convert to another language
```

**3. Smart Features:**
- **Auto-save:** Saves draft every 30 seconds
- **Smart Recipients:** Autocomplete from contacts
- **Attachment Drag & Drop:** Drag files to attach
- **Inline Images:** Paste images directly
- **Send Later:** Schedule for specific time
- **Undo Send:** 10-second window to cancel
- **Read Receipts:** Request confirmation
- **Signature Selector:** Multiple signatures
- **Template Selector:** Pre-written templates

**4. Templates:**
```typescript
// Built-in templates:
- Meeting Request
- Follow-up
- Introduction
- Thank You
- Out of Office
- Status Update
- Cold Outreach
- Customer Support Response

// Custom templates:
User can save frequently-used emails as templates
  → Name the template
  → Add placeholders {{name}}, {{date}}
  → One-click insert and customize
```

**5. Scheduled Send:**
```
Options:
  → Send at specific time (date picker)
  → Send tomorrow morning (9 AM)
  → Send Monday morning (9 AM)
  → Send in 1 hour
  → Send when recipient is online (AI-powered)
```

**6. Undo Send:**
```
Email sent!
  ↓
10-second countdown timer
  ↓
"Undo" button visible
  ↓
If clicked: Email cancelled, returned to drafts
If timeout: Email delivered
```

**UI Requirements:**
- Full-screen mode option
- Distraction-free writing
- Focus mode (hide sidebar)
- Split-screen (view email while replying)
- Keyboard shortcuts (Cmd+Enter to send)
- Send confirmation dialog (optional)
- Attachment file size indicator
- Character/word count
- Spell check

**Acceptance Criteria:**
- ✅ Composer loads instantly (< 500ms)
- ✅ Auto-save never loses data
- ✅ AI improvements are helpful 80%+ of the time
- ✅ Scheduled send works reliably
- ✅ Undo send works within 10-second window

#### 5.2 Quick Reply

**Description:** Reply to emails without leaving the email list view.

**Features:**
- Inline reply box (expands from email card)
- Pre-filled with AI suggestion (if available)
- Minimal interface (just text + send button)
- Quote original email (optional)
- Attach files
- Keyboard shortcut: R

**Use Cases:**
- Quick acknowledgments ("Thanks!", "Got it")
- Yes/no responses
- Brief status updates
- Fast replies to simple questions

**Acceptance Criteria:**
- ✅ Opens in < 200ms
- ✅ Supports AI pre-fill
- ✅ Sends without page reload
- ✅ Works on mobile

---

### 6. Email Organization & Management

#### 6.1 Labels & Folders

**Description:** Custom labels and traditional folder structure (optional).

**Label System:**
- Create unlimited custom labels
- Color-coded labels
- Multiple labels per email
- Label hierarchy (nested labels)
- Quick label assignment (keyboard shortcuts)
- Label filters (show only labeled emails)

**Folder System (Traditional):**
- Inbox
- Sent
- Drafts
- Starred
- Archive
- Trash
- Custom folders

**Smart Labels (AI-Generated):**
```
AI auto-suggests labels based on content:
  → "Urgent" - Time-sensitive emails
  → "Waiting on Reply" - Sent emails pending response
  → "To Review" - Documents attached
  → "Financial" - Invoices, receipts
  → "Personal" - Non-work emails
```

#### 6.2 Search & Filtering

**Description:** Powerful search with natural language and advanced filters.

**Search Features:**

**1. Natural Language Search:**
```
Examples that work:
  → "Emails from John last week"
  → "Unread emails with attachments"
  → "Invoices over $500"
  → "Meeting requests this month"
  → "Emails I haven't replied to"
```

**2. Advanced Filters:**
```typescript
Filters:
  - From: Specific sender or domain
  - To: Specific recipient
  - Subject: Keywords in subject
  - Body: Keywords in body
  - Has: attachment, links, images
  - Date: Today, yesterday, last 7 days, custom range
  - Status: Read, unread, starred, important
  - View: Imbox, Feed, Paper Trail
  - Label: Specific label
  - Size: > 5MB, > 10MB
```

**3. Saved Searches:**
```
Save frequently used searches:
  → "Unread important emails"
  → "Receipts this month"
  → "Emails from team"

Access via sidebar or keyboard shortcut
```

**4. Semantic Search:**
```
AI-powered similarity search:

User selects an email, clicks "Find Similar"
  ↓
AI finds emails with similar:
  - Topic/content
  - Sender relationship
  - Attachments
  - Sentiment
  - Urgency level
```

**UI Requirements:**
- Search bar at top (always visible)
- Instant results (< 500ms)
- Highlighted search terms
- Filter chips (removable)
- Search suggestions (autocomplete)
- Recent searches
- Result count

**Acceptance Criteria:**
- ✅ Search returns results in < 500ms
- ✅ Natural language queries work 90%+ of the time
- ✅ Advanced filters combine correctly (AND/OR logic)
- ✅ Semantic search finds relevant emails

#### 6.3 Bulk Operations

**Description:** Perform actions on multiple emails simultaneously.

**Bulk Selection:**
- Select all (checkbox at top)
- Select by criteria (all unread, all from sender)
- Multi-select (Shift+click, Cmd+click)
- Select range (click, Shift+click)

**Bulk Actions:**
- Mark as read/unread
- Star/unstar
- Archive (remove from view)
- Delete (move to trash)
- Apply label
- Move to view (Imbox/Feed/Paper Trail)
- Forward all
- Export (EML files, CSV list)

**UI Requirements:**
- Bulk action bar appears at top when items selected
- Action buttons with icons
- Confirmation dialogs for destructive actions
- Progress indicator for large batches
- Undo option for bulk operations

**Acceptance Criteria:**
- ✅ Can select 100+ emails smoothly
- ✅ Bulk operations complete in < 2 seconds
- ✅ Undo works for bulk operations
- ✅ UI remains responsive during bulk operations

---

### 7. Productivity Workflows

#### 7.1 Reply Later

**Description:** Snooze emails with intent. Set a specific time to reply, optionally add a note.

**User Stories:**
- As a user, I want to defer emails until I have time to respond properly
- As a user, I want to be reminded to reply at a specific time
- As a user, I want to add notes about what I need to do

**How It Works:**
```
User clicks "Reply Later" on email
  ↓
Choose when to be reminded:
  → Later today (6 PM)
  → Tomorrow morning (9 AM)
  → This weekend (Saturday 10 AM)
  → Next week (Monday 9 AM)
  → Custom date/time
  ↓
Optionally add note:
  → "Need to check with team first"
  → "Wait for John's response"
  ↓
Email moves to "Reply Later" view
  ↓
At scheduled time:
  → Email bubbles back to Imbox
  → Push notification (optional)
  → Email marked with "Reply Later" badge
```

**Reply Later View:**
- Shows all snoozed emails
- Sorted by snooze time (soonest first)
- Visual timeline (Today, Tomorrow, This Week, Later)
- Edit snooze time
- View note
- Reply directly from this view

**Focus Reply Mode:**
```
Batch process Reply Later emails:
  ↓
Full-screen mode
  ↓
Shows one email at a time
  ↓
Quick actions:
  → Reply (opens composer)
  → Snooze Again
  → Archive (mark done)
  → Skip (move to next)
  ↓
Navigate with keyboard (J/K)
  ↓
Track progress (3 of 10 complete)
```

**Acceptance Criteria:**
- ✅ Snooze time selection is fast (< 5 seconds)
- ✅ Emails bubble back at correct time
- ✅ Notifications work reliably
- ✅ Focus mode helps process 10+ emails quickly

#### 7.2 Set Aside

**Description:** Temporary holding area for emails you're not ready to decide on.

**Philosophy:**
- Not urgent enough for Imbox
- Not ready to archive
- Need to think about it
- Come back to it later

**How It Works:**
```
User clicks "Set Aside" on email
  ↓
Email moves to "Set Aside" view
  ↓
After 3 days:
  → Email bubbles back to Imbox
  → Notification (optional)
  ↓
User can:
  → Move to Imbox (it's important)
  → Move to Feed (it's not important)
  → Archive (done with it)
  → Set Aside again (snooze longer)
```

**Set Aside View:**
- Shows all set-aside emails
- Sorted by date (oldest first)
- Days remaining until bubble up
- Drag & drop to move
- Bulk clear option

**Smart Features:**
- **Auto-Archive:** Emails set aside 3+ times auto-archive
- **AI Suggestion:** "This email has been set aside 3 times. Would you like to unsubscribe or block sender?"

**Acceptance Criteria:**
- ✅ One-click to set aside
- ✅ Emails bubble back after 3 days
- ✅ Can manually retrieve anytime
- ✅ UI feels like temporary parking lot

#### 7.3 Clip & Reply

**Description:** Select any text in an email, instantly reply with that text quoted.

**User Stories:**
- As a user, I want to reply to a specific point in a long email
- As a user, I want to quote relevant text in my reply
- As a user, I want to save time formatting quotes

**How It Works:**
```
User selects text in email body
  ↓
Floating "Clip & Reply" button appears
  ↓
User clicks button
  ↓
Composer opens with:
  → Selected text quoted
  → Cursor positioned after quote
  → Ready to type response
```

**UI Requirements:**
- Button appears on text selection (100ms delay)
- Positioned near selected text (not blocking)
- Smooth fade-in animation
- Works on mobile (long press)
- Keyboard shortcut: Cmd+Shift+R

**Quote Formatting:**
```markdown
> [Selected text appears here]
> Multiple lines are quoted properly

[Cursor positioned here for user response]
```

**Acceptance Criteria:**
- ✅ Button appears instantly on selection
- ✅ Quote formatting is clean
- ✅ Works for long selections (500+ words)
- ✅ Mobile long-press works smoothly

---

### 8. Privacy & Security Features

#### 8.1 Tracker Blocking

**Description:** Block email tracking pixels, strip UTM parameters, protect privacy.

**What Gets Blocked:**
- **Tracking Pixels:** 1x1 transparent images used to track opens
- **Read Receipts:** Third-party read tracking
- **Link Tracking:** URL redirects that track clicks
- **UTM Parameters:** ?utm_source=, ?utm_campaign=
- **Email Fingerprinting:** Unique identifiers in images/links

**How It Works:**
```
Email arrives
  ↓
Scan for tracking mechanisms:
  - <img src="track.png" width="1" height="1">
  - URLs with tracking parameters
  - Known tracking domains
  ↓
Block/strip before displaying:
  - Remove tracking pixels
  - Proxy images through our server
  - Strip UTM parameters from links
  - Replace tracking URLs with direct links
  ↓
Display clean email + privacy badge
```

**Privacy Badge:**
```
"🛡️ 3 trackers blocked"

Click to see details:
  - 1 tracking pixel removed
  - 2 tracking links cleaned
  - Read receipt blocked
```

**User Controls:**
- Enable/disable tracker blocking (global setting)
- Whitelist senders (allow tracking for specific senders)
- View blocked tracking history
- Export tracking report

**Acceptance Criteria:**
- ✅ Blocks 95%+ of tracking pixels
- ✅ Strips UTM parameters from all links
- ✅ Doesn't break legitimate images
- ✅ Privacy badge shows accurate count

#### 8.2 Data Security

**Description:** Enterprise-grade security for email data and credentials.

**Encryption:**
- **At Rest:** AES-256-GCM for all stored data
- **In Transit:** TLS 1.3 for all connections
- **Credentials:** Separate encryption keys, rotated monthly
- **Attachments:** Encrypted in object storage

**Authentication:**
- **OAuth 2.0:** Preferred method (no password storage)
- **2FA:** Two-factor authentication support
- **Session Management:** Secure tokens, auto-logout
- **Device Management:** See active sessions, revoke access

**Compliance:**
- **GDPR:** Right to delete, data export, consent management
- **SOC 2:** Security audit certification (Year 2)
- **HIPAA:** Healthcare compliance option (Enterprise)
- **CCPA:** California privacy compliance

**Data Retention:**
- User controls retention policy
- Auto-delete old emails (optional)
- Permanent deletion (unrecoverable)
- Audit logs for compliance

**Acceptance Criteria:**
- ✅ All credentials encrypted at rest
- ✅ OAuth preferred over password storage
- ✅ 2FA available for all users
- ✅ GDPR data export works correctly

---

### 9. Additional Features

#### 9.1 Keyboard Shortcuts

**Description:** Gmail-inspired keyboard shortcuts for power users.

**Core Shortcuts:**
| Key | Action | Context |
|-----|--------|---------|
| `c` | Compose new email | Global |
| `r` | Reply to email | Email selected |
| `a` | Reply all | Email selected |
| `f` | Forward email | Email selected |
| `j` | Next email | Email list |
| `k` | Previous email | Email list |
| `x` | Select email | Email list |
| `e` | Archive email | Email selected |
| `#` | Delete email | Email selected |
| `s` | Star/unstar email | Email selected |
| `u` | Mark as unread | Email selected |
| `l` | Apply label | Email selected |
| `v` | Move to view | Email selected |
| `/` | Focus search | Global |
| `Cmd+K` | Command palette | Global |
| `Cmd+Enter` | Send email | Composer |
| `Esc` | Close popup/modal | Global |

**View Shortcuts:**
| Key | Action |
|-----|--------|
| `g + i` | Go to Imbox |
| `g + f` | Go to Feed |
| `g + p` | Go to Paper Trail |
| `g + s` | Go to Screener |
| `g + r` | Go to Reply Later |
| `g + a` | Go to Set Aside |

**Customization:**
- Users can customize shortcuts
- Visual shortcut guide (help menu)
- Shortcut hints in UI (hover)
- Practice mode for learning

**Acceptance Criteria:**
- ✅ Shortcuts work reliably
- ✅ No conflicts with browser shortcuts
- ✅ Shortcuts customizable
- ✅ Help guide accessible

#### 9.2 Command Palette

**Description:** Cmd+K quick actions menu for power users.

**Features:**
- Fuzzy search for any action
- Recent actions at top
- Keyboard navigation
- Action descriptions
- Shortcut hints

**Available Actions:**
```typescript
Categories:
  - Navigation (Go to Imbox, Go to Screener, etc.)
  - Email Actions (Reply, Archive, Delete, etc.)
  - Search (Search emails, Filter by sender, etc.)
  - Settings (Change theme, Keyboard shortcuts, etc.)
  - AI (Summarize email, Generate reply, etc.)
  - Account (Add account, Switch account, etc.)
```

**Example Usage:**
```
User presses Cmd+K
  ↓
Palette opens
  ↓
User types: "arc"
  ↓
Results:
  → Archive email
  → Go to Archive folder
  → Bulk archive selected
  ↓
User presses Enter
  ↓
Action executes
```

**Acceptance Criteria:**
- ✅ Opens instantly (< 100ms)
- ✅ Fuzzy search works well
- ✅ Covers all major actions
- ✅ Keyboard navigation smooth

#### 9.3 Email Templates & Snippets

**Description:** Pre-written email templates and text snippets for common responses.

**Templates:**
```typescript
Built-in Templates:
  - Meeting Request
  - Follow-up Email
  - Introduction Email
  - Thank You Email
  - Out of Office
  - Project Status Update
  - Customer Support Response
  - Invoice Request
  - Cold Outreach
  - Feedback Request

Custom Templates:
  - Save any email as template
  - Name and categorize
  - Add placeholders {{name}}, {{company}}, {{date}}
  - Share with team (Team plan)
```

**Snippets:**
```typescript
Short text snippets for common phrases:

/thanks → "Thank you for reaching out!"
/schedule → "Please use this link to schedule: [calendly link]"
/signature → [Your full email signature]
/meeting → "Let's schedule a meeting to discuss this further."

Snippets expand as you type
Searchable snippet library
Custom snippets with variables
```

**Acceptance Criteria:**
- ✅ Templates save 80%+ composition time
- ✅ Snippets expand correctly
- ✅ Placeholders auto-fill
- ✅ Easy to manage library

#### 9.4 Follow-Up Reminders

**Description:** Get reminded to follow up if someone doesn't reply to your email.

**How It Works:**
```
User sends email
  ↓
Optionally enable "Follow-up Reminder"
  ↓
Choose timeframe:
  → If no reply in 2 days
  → If no reply in 1 week
  → Custom timeframe
  ↓
If no reply received:
  → Notification: "No reply from John about Q4 Report"
  → Email appears in "Needs Follow-up" view
  → Suggested follow-up message
```

**Smart Features:**
- **Auto-detect:** AI suggests enabling reminder for important sends
- **Smart Timing:** Considers recipient timezone, business days
- **Snooze:** "They're probably on vacation, remind me next week"

**Acceptance Criteria:**
- ✅ Reminders trigger accurately
- ✅ AI suggestions are helpful
- ✅ Can snooze reminders easily
- ✅ Works across all email accounts

---

## 🎯 Feature Priority Matrix

### MVP (Must Have)

**Priority 1: Core Email Functionality**
- ✅ Email account connection (OAuth + IMAP/SMTP)
- ✅ Email sync (real-time)
- ✅ Email list view
- ✅ Email viewer
- ✅ Email composer
- ✅ Send/receive emails
- ✅ Search and filter
- ✅ Basic folders (Inbox, Sent, Drafts, etc.)

**Priority 2: Hey-Inspired Workflow**
- ✅ Email screening system
- ✅ Imbox/Feed/Paper Trail views
- ✅ AI-powered auto-classification
- ✅ Sender routing (future emails)

**Priority 3: AI Features**
- ✅ AI email summaries (hover)
- ✅ AI quick reply suggestions
- ✅ AI copilot panel
- ✅ Smart actions

### V1.1 (Nice to Have)

**Priority 4: Productivity Workflows**
- ⏳ Reply Later
- ⏳ Set Aside
- ⏳ Focus Reply Mode
- ⏳ Clip & Reply

**Priority 5: Power User Features**
- ⏳ Keyboard shortcuts
- ⏳ Command palette
- ⏳ Advanced rules
- ⏳ Templates & snippets

### V2.0 (Future)

**Priority 6: Team Features**
- 🔮 Shared inboxes
- 🔮 Team analytics
- 🔮 Collaboration tools
- 🔮 Admin controls

**Priority 7: Advanced Features**
- 🔮 Follow-up reminders
- 🔮 Scheduled send
- 🔮 Undo send
- 🔮 Read receipts
- 🔮 Email analytics

---

## ✅ Acceptance Testing

### Test Cases

**Email Screening:**
- [ ] New sender emails go to Screener
- [ ] Screened senders bypass Screener
- [ ] AI suggestions are accurate (80%+)
- [ ] Decisions route future emails correctly
- [ ] Block works (emails hidden)

**AI Features:**
- [ ] AI summary appears on hover (< 500ms)
- [ ] Quick replies are relevant (80%+)
- [ ] Copilot understands context
- [ ] Smart actions match email content

**Email Operations:**
- [ ] Can send email reliably
- [ ] Can reply/forward correctly
- [ ] Attachments upload successfully
- [ ] Search returns accurate results
- [ ] Bulk operations work on 100+ emails

**Performance:**
- [ ] Page load < 2 seconds
- [ ] Email list scrolls at 60 FPS
- [ ] AI responses < 3 seconds
- [ ] Sync latency < 2 minutes
- [ ] No memory leaks after 1 hour use

**Security:**
- [ ] Credentials encrypted at rest
- [ ] OAuth flow works correctly
- [ ] 2FA functions properly
- [ ] Session timeout works
- [ ] Data export completes successfully

---

**Next Documents:**
- [← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)
- [Technical Specifications →](AI_EMAIL_CLIENT_PRD_TECHNICAL.md)
- [UI/UX Guidelines →](AI_EMAIL_CLIENT_PRD_DESIGN.md)
- [Data Models →](AI_EMAIL_CLIENT_PRD_DATA_MODELS.md)

