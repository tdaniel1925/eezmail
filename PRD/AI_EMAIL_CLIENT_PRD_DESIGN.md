# AI Email Client - UI/UX Design Guidelines

[← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)

---

## 🎨 Design Philosophy

### Core Principles

**1. Focus Over Features**
- Every element must reduce cognitive load
- Hide complexity, reveal progressively
- Default to simplicity, power when needed

**2. Speed & Responsiveness**
- Instant feedback (< 100ms)
- Optimistic updates
- Skeleton loaders, never blank screens
- Smooth 60 FPS animations

**3. Delightful Interactions**
- Micro-animations for state changes
- Natural motion (easing, spring physics)
- Haptic feedback (mobile)
- Sound effects (optional)

**4. Accessibility First**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast 4.5:1 minimum
- Focus indicators

**5. Consistency**
- Predictable patterns
- Reusable components
- Clear information hierarchy
- Coherent color system

---

## 🎭 Visual Design System

### Color Palette

**Light Mode:**
```typescript
const colors = {
  // Primary (Brand)
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9', // Main brand color
    600: '#0284C7',
    700: '#0369A1',
  },
  
  // Neutrals
  gray: {
    50: '#F9FAFB',  // Background light
    100: '#F3F4F6', // Card backgrounds
    200: '#E5E7EB', // Borders
    300: '#D1D5DB', // Disabled text
    400: '#9CA3AF', // Placeholder text
    500: '#6B7280', // Secondary text
    700: '#374151', // Primary text
    900: '#111827', // Headings
  },
  
  // Semantic
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  error: '#EF4444',   // Red
  info: '#3B82F6',    // Blue
  
  // Email-specific
  unread: '#0EA5E9',   // Unread indicator
  starred: '#F59E0B',  // Star color
  important: '#EF4444', // Important badge
  
  // Hey-inspired accents
  imboxGold: '#FFD700',      // Imbox view
  feedGreen: '#10B981',       // Feed view
  paperBlue: '#3B82F6',       // Paper Trail view
};
```

**Dark Mode:**
```typescript
const darkColors = {
  // Primary (Slightly muted)
  primary: {
    500: '#38BDF8',
    600: '#0EA5E9',
  },
  
  // Neutrals (Inverted)
  gray: {
    50: '#18181B',  // Background
    100: '#27272A', // Card backgrounds
    200: '#3F3F46', // Borders
    700: '#D4D4D8', // Primary text
    900: '#FAFAFA', // Headings
  },
  
  // Higher contrast for dark mode
};
```

### Typography

**Font Stack:**
```css
/* Primary: System fonts for performance */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;

/* Monospace (code, email addresses) */
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 
             'Courier New', monospace;
```

**Type Scale:**
```typescript
const typography = {
  // Headings
  h1: { size: '2.25rem', weight: 700, lineHeight: 1.2 }, // 36px
  h2: { size: '1.875rem', weight: 600, lineHeight: 1.3 }, // 30px
  h3: { size: '1.5rem', weight: 600, lineHeight: 1.4 },   // 24px
  h4: { size: '1.25rem', weight: 600, lineHeight: 1.5 },  // 20px
  
  // Body
  body: { size: '1rem', weight: 400, lineHeight: 1.6 },       // 16px
  bodySmall: { size: '0.875rem', weight: 400, lineHeight: 1.5 }, // 14px
  
  // UI
  caption: { size: '0.75rem', weight: 500, lineHeight: 1.4 }, // 12px
  label: { size: '0.875rem', weight: 500, lineHeight: 1.4 },  // 14px
  
  // Email-specific
  subject: { size: '1rem', weight: 600, lineHeight: 1.4 },
  snippet: { size: '0.875rem', weight: 400, lineHeight: 1.5 },
  sender: { size: '0.875rem', weight: 500, lineHeight: 1.4 },
};
```

### Spacing System

**8px Base Unit:**
```typescript
const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
};
```

### Elevation (Shadows)

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  
  // Hover states
  hover: '0 10px 20px -5px rgb(0 0 0 / 0.15)',
};
```

### Border Radius

```typescript
const borderRadius = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  full: '9999px', // Circular
};
```

---

## 📐 Layout Structure

### 3-Panel Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Top Header (64px)                           │
│  [Logo]  [Account Selector]  [Search]       [Settings] [Profile]   │
└─────────────────────────────────────────────────────────────────────┘
┌───────────────┬─────────────────────────────┬──────────────────────┐
│               │                             │                      │
│   Sidebar     │       Email List            │    Email Viewer /    │
│   (280px)     │       (Flexible)            │    AI Copilot        │
│               │                             │    (420px)           │
│ ┌───────────┐ │ ┌─────────────────────────┐ │ ┌─────────────────┐│
│ │           │ │ │  Email Card             │ │ │                 ││
│ │ Screener  │ │ │  [★] Subject            │ │ │   Email Content ││
│ │  (12)     │ │ │  From: john@acme.com    │ │ │                 ││
│ │           │ │ │  Snippet...             │ │ │                 ││
│ │ Imbox     │ │ └─────────────────────────┘ │ │                 ││
│ │  (23)     │ │                             │ │                 ││
│ │           │ │ ┌─────────────────────────┐ │ │                 ││
│ │ The Feed  │ │ │  Email Card             │ │ └─────────────────┘│
│ │  (156)    │ │ │  Subject                │ │ ┌─────────────────┐│
│ │           │ │ │  From: ...              │ │ │  AI Copilot     ││
│ │ Paper     │ │ └─────────────────────────┘ │ │                 ││
│ │  Trail    │ │                             │ │  Ask me anything││
│ │  (45)     │ │ [Load More]                 │ │  about this email││
│ │           │ │                             │ │                 ││
│ └───────────┘ │                             │ └─────────────────┘│
│               │                             │                      │
│ ┌───────────┐ │                             │                      │
│ │ Folders   │ │                             │                      │
│ │           │ │                             │                      │
│ │ • Inbox   │ │                             │                      │
│ │ • Sent    │ │                             │                      │
│ │ • Drafts  │ │                             │                      │
│ │ • Starred │ │                             │                      │
│ │ • Archive │ │                             │                      │
│ └───────────┘ │                             │                      │
└───────────────┴─────────────────────────────┴──────────────────────┘
```

**Responsive Breakpoints:**

```typescript
const breakpoints = {
  mobile: '0px',      // < 768px
  tablet: '768px',    // 768px - 1024px
  desktop: '1024px',  // 1024px - 1440px
  wide: '1440px',     // > 1440px
};
```

**Mobile Layout (< 768px):**
```
Full-screen single panel:
  → Email List (default view)
  → Tap email → Full-screen Email Viewer
  → Tap back → Return to list
  → Sidebar accessible via hamburger menu
```

**Tablet Layout (768px - 1024px):**
```
Two-panel:
  → Sidebar (hidden by default, slide-over)
  → Email List (60%) + Email Viewer (40%)
```

**Desktop Layout (> 1024px):**
```
Three-panel:
  → Sidebar (280px fixed)
  → Email List (flexible, min 400px)
  → Email Viewer / AI Copilot (420px fixed)
```

---

## 🖼️ Component Design

### 1. Email Card (List Item)

**Standard Email Card:**
```
┌───────────────────────────────────────────────────────────────┐
│ ★  [Subject Line Here - Bold]                          2:34 PM│
│    John Doe <john@acme.com>                                   │
│    Snippet: This is a preview of the email content...     [📎]│
└───────────────────────────────────────────────────────────────┘
```

**Anatomy:**
- **Height:** 72px (comfortable), 60px (compact), 84px (spacious)
- **Left:** Star icon (clickable, gold when starred)
- **Top Line:** Subject (bold, truncate with ellipsis)
- **Time:** Right-aligned, relative time (2:34 PM, Yesterday, Dec 5)
- **Second Line:** Sender name + email (gray, medium weight)
- **Third Line:** Snippet (gray, light weight, 2 lines max)
- **Right:** Attachment indicator (if has attachments)

**States:**
```typescript
// Unread
background: white (light mode) / gray-900 (dark mode)
border-left: 3px solid blue-500
subject: font-weight: 600

// Read
background: gray-50 (light mode) / gray-800 (dark mode)
border-left: none
subject: font-weight: 400

// Hover
background: gray-100 (light mode) / gray-700 (dark mode)
cursor: pointer
transform: translateY(-1px)
shadow: sm

// Selected
background: blue-50 (light mode) / blue-900/20 (dark mode)
border: 2px solid blue-500
```

**Interactions:**
- **Click:** Open email in viewer
- **Hover (400ms):** Show AI summary popup
- **Checkbox (left):** Bulk selection mode
- **Star icon (top-left):** Toggle starred
- **Right-click:** Context menu (Reply, Archive, Delete, etc.)

**Accessibility:**
- `role="article"`
- `aria-label="Email from {sender}, subject: {subject}"`
- Keyboard navigation (Tab, Enter to open)
- Focus indicator (2px blue outline)

---

### 2. Email Viewer

**Full Email Display:**
```
┌───────────────────────────────────────────────────────────────┐
│  [← Back] [Archive] [Delete] [Reply] [Forward]     [•••]     │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Email Subject Goes Here                                       │
│                                                                 │
│  From: John Doe <john@acme.com>                    2:34 PM    │
│  To: Me <me@example.com>                                      │
│  Cc: team@acme.com                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📎 Attachment: report.pdf (2.3 MB)          [Download]  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Email body content appears here with proper formatting.       │
│  Support for rich text, images, links, etc.                   │
│                                                                 │
│  Blockquotes appear indented with a left border:               │
│  │ This is a quoted section from a previous email.            │
│  │ Multiple lines of quoted text.                             │
│                                                                 │
│  [Reply]  [Reply All]  [Forward]                              │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Header:**
- **Action Bar:** Back, Archive, Delete, Reply, Forward, More (•••)
- **Subject:** Large, bold, prominent
- **Metadata:** From, To, Cc, Bcc (expandable), Timestamp
- **Attachments:** List with icons, file size, download buttons

**Body:**
- **Typography:** Comfortable reading (16px body, 1.6 line-height)
- **Images:** Inline images displayed, external images lazy-loaded
- **Links:** Blue, underlined on hover, open in new tab
- **Quoted Text:** Indented, left border, slightly dimmed
- **Code Blocks:** Monospace font, background highlight

**Thread View:**
- Collapsed previous emails (expand/collapse toggle)
- Current email fully visible
- Smooth expand/collapse animations

---

### 3. AI Summary Popup

**Hover Popup (appears at 400ms hover):**
```
┌───────────────────────────────────────────────────────────────┐
│  🤖 AI Summary                                        [✕]     │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  This email is a meeting request from John for next Friday    │
│  to discuss Q4 planning. He's proposing 2 PM and asking for   │
│  agenda items in advance.                                      │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  💬 Quick Replies:                                            │
│                                                                 │
│  [That time works for me! 👍]                                 │
│  [Can we do Thursday instead?]                                 │
│  [Let me check and get back to you]                           │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  ⚡ Smart Actions:                                             │
│                                                                 │
│  [📅 Schedule Meeting] [✅ Add to Tasks] [⏰ Set Reminder]    │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  📧 Related Emails from John:                                 │
│                                                                 │
│  • Q3 Planning Follow-up (2 days ago)                         │
│  • Budget Approval Request (1 week ago)                       │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Design Details:**
- **Max Width:** 400px
- **Position:** Near cursor, adjusted to stay in viewport
- **Background:** White card with shadow-lg
- **Fade-in:** 200ms smooth transition
- **Close Delay:** 300ms after mouse leaves
- **Loading State:** Skeleton loader while fetching

**Interactions:**
- Click quick reply → Open composer with pre-filled text
- Click smart action → Execute action (open modal, create task, etc.)
- Click related email → Open that email in viewer
- Click anywhere outside → Close popup

---

### 4. Email Composer

**Full-Screen Composer Mode:**
```
┌───────────────────────────────────────────────────────────────┐
│  [✕ Close]  Compose New Email             [Send] [Schedule] ▼│
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  To:   [john@acme.com ✕] [+ Add]                      Cc Bcc │
│  Subject: [Re: Q4 Planning Meeting                          ] │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  🤖 AI Tone: [Professional ▼]  [Improve Writing] [Shorten]   │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Compose email body here...]                                 │
│                                                                 │
│  • Rich text formatting toolbar                                │
│  • B  I  U  Link  Image  Bullet  Number  Code                │
│                                                                 │
├───────────────────────────────────────────────────────────────┤
│  📎 Attachments: report.pdf (2.3 MB) [✕]                      │
└───────────────────────────────────────────────────────────────┘
```

**Features:**
- **Recipient Chips:** Removable chips with autocomplete
- **Subject Line:** Large input, auto-focus on "Re:" emails
- **AI Toolbar:** Tone selector, improvement actions
- **Rich Text Editor:** TipTap/Lexical with floating toolbar
- **Attachment Area:** Drag & drop zone, file list
- **Auto-Save:** "Saving..." indicator, last saved timestamp
- **Keyboard Shortcuts:** Cmd+Enter to send, Cmd+Shift+S to save draft

**Send Options (Dropdown):**
- Send Now (default)
- Schedule Send...
- Send + Archive
- Send + Mark Done

**Undo Send:**
```
┌─────────────────────────────────────────────────────┐
│  ✅ Email sent!  [Undo] (9 seconds remaining)     │
└─────────────────────────────────────────────────────┘
```

---

### 5. Screener View

**Screening Interface:**
```
┌───────────────────────────────────────────────────────────────┐
│  👋 Screener                              12 new senders       │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  From: Jane Smith <jane@startup.com>                   │  │
│  │  Subject: Partnership Opportunity                       │  │
│  │                                                          │  │
│  │  Snippet: Hi there! I came across your profile and...   │  │
│  │                                                          │  │
│  │  🤖 AI Suggestion: The Feed (Newsletter)  85% confident│  │
│  │     Reason: Contains unsubscribe link, promotional     │  │
│  │                                                          │  │
│  │  ┌───────────────────┐  ┌───────────────────┐          │  │
│  │  │  ✨ Yes - Imbox   │  │  📰 The Feed       │          │  │
│  │  │  (Important)      │  │  (Newsletter)      │          │  │
│  │  └───────────────────┘  └───────────────────┘          │  │
│  │                                                          │  │
│  │  ┌───────────────────┐  ┌───────────────────┐          │  │
│  │  │  🧾 Paper Trail   │  │  🚫 Block          │          │  │
│  │  │  (Receipts)       │  │  (Never see again) │          │  │
│  │  └───────────────────┘  └───────────────────┘          │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [View all 3 emails from this sender]                         │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Design Details:**
- **Card-Based:** One sender at a time, full focus
- **Large Buttons:** 4 clear decision buttons (2x2 grid)
- **AI Badge:** Highlighted suggestion with confidence score
- **Smooth Animations:** Card slides out after decision (300ms)
- **Progress:** "12 senders remaining" counter
- **Keyboard Shortcuts:** 1=Imbox, 2=Feed, 3=Paper Trail, 4=Block

**Button States:**
- **Default:** Light background, border
- **AI Suggested:** Blue border, blue text, subtle glow
- **Hover:** Slightly darker background, lifted shadow
- **Active:** Pressed state, scale(0.98)

---

### 6. Folder Sidebar

**Hey Mode Sidebar:**
```
┌───────────────────┐
│  📧 Accounts  ▼  │
│  work@acme.com   │
│                   │
│  [+ Add Account] │
│                   │
├───────────────────┤
│  Hey Views        │
├───────────────────┤
│  👋 Screener (12)│ ← Badge for pending
│  ✨ Imbox (23)   │
│  📰 The Feed (156│
│  🧾 Paper Trail (│
│  ⏰ Reply Later (│
│  📌 Set Aside (2)│
│                   │
├───────────────────┤
│  Folders          │
├───────────────────┤
│  📥 Inbox         │
│  📤 Sent          │
│  ✏️ Drafts (3)   │
│  ⭐ Starred       │
│  📁 Archive       │
│  🗑️ Trash         │
│                   │
├───────────────────┤
│  Labels           │
├───────────────────┤
│  🟢 Work          │
│  🔵 Personal      │
│  🟡 Urgent        │
│  [+ Add Label]   │
│                   │
└───────────────────┘
```

**Interactions:**
- **Hover:** Background changes, cursor pointer
- **Active:** Bold text, blue background
- **Badge:** Gray background, white text, right-aligned
- **Collapsible:** Sections can collapse/expand
- **Drag & Drop:** Drag emails to folders/labels

---

### 7. Command Palette (Cmd+K)

**Quick Actions Menu:**
```
┌───────────────────────────────────────────────────────────────┐
│  🔍 Search for actions...                                     │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  Recent Actions                                                │
│  → Go to Imbox                                     Cmd+Shift+I│
│  → Archive Email                                            E  │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  Navigation                                                    │
│  → Go to Screener                                              │
│  → Go to The Feed                                              │
│  → Go to Paper Trail                                           │
│                                                                 │
│  Email Actions                                                 │
│  → Reply to Email                                           R  │
│  → Archive Email                                            E  │
│  → Delete Email                                             #  │
│                                                                 │
│  AI Actions                                                    │
│  → Summarize Email                                             │
│  → Generate Reply                                              │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**Design Details:**
- **Centered Modal:** Max-width 600px, centered on screen
- **Fuzzy Search:** Instant filtering as you type
- **Keyboard Nav:** Up/down arrows, Enter to execute
- **Recent Actions:** Shows last 3 actions at top
- **Grouped:** Actions grouped by category
- **Shortcuts:** Right-aligned shortcut hints

---

## 🎬 Animations & Transitions

### Motion Principles

**1. Purpose-Driven**
- Animations communicate state changes
- Never animate for decoration only
- Guide user attention

**2. Fast & Responsive**
- Instant feedback (< 100ms)
- Smooth 60 FPS
- Interruptible (can cancel mid-animation)

**3. Natural Motion**
- Easing functions (ease-out for enter, ease-in for exit)
- Spring physics for drag & drop
- Avoid linear timing

### Animation Library

```typescript
// Framer Motion variants

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 },
};

// Hover lift
const hoverLift = {
  rest: { y: 0, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
  hover: { y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
};

// Email card exit (after screening decision)
const exitScreen = {
  exit: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};
```

### Specific Interactions

**Email Card Hover:**
```typescript
// Smooth lift on hover
<motion.div
  variants={hoverLift}
  initial="rest"
  whileHover="hover"
  transition={{ duration: 0.15 }}
>
  <EmailCard />
</motion.div>
```

**Popup Appearance:**
```typescript
// Fade + scale in
<AnimatePresence>
  {isOpen && (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AISummaryPopup />
    </motion.div>
  )}
</AnimatePresence>
```

**Loading Skeleton:**
```typescript
// Pulse animation
<motion.div
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  className="bg-gray-200 rounded h-16"
/>
```

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

**1. Color Contrast:**
- Text: 4.5:1 minimum (normal text)
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum

**2. Keyboard Navigation:**
```typescript
// All interactive elements keyboard-accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Archive email"
>
  Archive
</button>

// Focus management
useFocusTrap(modalRef); // Trap focus in modals
useAutoFocus(inputRef); // Auto-focus on open
```

**3. Screen Readers:**
```typescript
// Semantic HTML
<main aria-label="Email list">
  <article aria-label={`Email from ${sender}, subject: ${subject}`}>
    <h2 id="email-subject">{subject}</h2>
    <p aria-describedby="email-subject">{snippet}</p>
  </article>
</main>

// Live regions for dynamic updates
<div role="status" aria-live="polite" aria-atomic="true">
  {successMessage}
</div>
```

**4. Focus Indicators:**
```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**5. Alt Text:**
```typescript
<img src={attachment.url} alt={attachment.filename} />
<button aria-label="Close popup">
  <XIcon aria-hidden="true" />
</button>
```

---

## 📱 Mobile Design

### Touch Targets

**Minimum Size: 44x44px (iOS), 48x48px (Android)**

```typescript
// Button sizing
const touchTarget = {
  minWidth: '48px',
  minHeight: '48px',
  padding: '12px',
};
```

### Mobile-Specific Interactions

**Swipe Gestures:**
```typescript
// Swipe to archive
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x < -100) {
      archiveEmail();
    }
  }}
>
  <EmailCard />
</motion.div>
```

**Pull to Refresh:**
```typescript
// Pull down to sync
<PullToRefresh onRefresh={syncEmails}>
  <EmailList />
</PullToRefresh>
```

**Long Press:**
```typescript
// Long press for bulk selection
<LongPressable
  onLongPress={() => enableSelectionMode()}
  delayLongPress={500}
>
  <EmailCard />
</LongPressable>
```

---

## 🌙 Dark Mode

### Theme Switching

```typescript
// System preference detection
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Theme toggle
const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

// Apply theme
useEffect(() => {
  const root = document.documentElement;
  const effectiveTheme = theme === 'system' 
    ? (prefersDark ? 'dark' : 'light')
    : theme;
    
  root.classList.toggle('dark', effectiveTheme === 'dark');
}, [theme, prefersDark]);
```

### Dark Mode Colors

**Higher contrast for readability:**
- Background: Near-black (#121212, not pure black)
- Text: Off-white (#F5F5F5, not pure white)
- Borders: Lighter gray for definition
- Shadows: Lighter for depth perception

---

## 🎯 Performance Optimization

### Image Optimization

```typescript
// Next.js Image component
<Image
  src={attachment.url}
  alt={attachment.filename}
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  blurDataURL={attachment.thumbnail}
  loading="lazy"
/>
```

### Code Splitting

```typescript
// Lazy load heavy components
const EmailViewer = lazy(() => import('./email-viewer'));
const EmailComposer = lazy(() => import('./email-composer'));
```

### Memoization

```typescript
// Avoid unnecessary re-renders
const EmailCard = memo(({ email }: { email: Email }) => {
  return <div>...</div>;
});

// Memoize expensive computations
const filteredEmails = useMemo(
  () => emails.filter(e => e.folderName === 'inbox'),
  [emails]
);
```

---

## 🧪 Design Tokens (Tailwind Config)

```typescript
// tailwind.config.ts

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        success: colors.green,
        warning: colors.amber,
        error: colors.red,
        
        // Custom
        'imbox-gold': '#FFD700',
        'feed-green': '#10B981',
        'paper-blue': '#3B82F6',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      
      boxShadow: {
        'hover': '0 10px 20px -5px rgb(0 0 0 / 0.15)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
};
```

---

## ✅ Design Checklist

### Before Shipping

**Visual Design:**
- [ ] All colors meet contrast requirements (4.5:1)
- [ ] Typography scale is consistent
- [ ] Spacing uses 8px grid
- [ ] Shadows and elevation consistent
- [ ] Dark mode tested and polished

**Interactions:**
- [ ] All buttons have hover/active states
- [ ] Loading states for async operations
- [ ] Error states with helpful messages
- [ ] Empty states with clear CTAs
- [ ] Success feedback (toasts, confirmations)

**Accessibility:**
- [ ] Keyboard navigation works throughout
- [ ] Screen reader labels on all interactive elements
- [ ] Focus indicators visible
- [ ] Skip links for navigation
- [ ] ARIA attributes where needed

**Performance:**
- [ ] Images optimized and lazy-loaded
- [ ] Heavy components code-split
- [ ] Animations run at 60 FPS
- [ ] No layout shifts (CLS < 0.1)
- [ ] Fast interaction (INP < 200ms)

**Responsive:**
- [ ] Works on mobile (375px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Touch targets 48x48px minimum
- [ ] Swipe gestures on mobile

**Polish:**
- [ ] Micro-animations add delight
- [ ] Smooth transitions between states
- [ ] No janky scrolling
- [ ] Fast perceived performance
- [ ] Delightful empty states

---

**Congratulations! 🎉** You now have a comprehensive design system for the AI Email Client. This PRD covers everything needed to build a world-class email experience.

---

**Complete PRD Documents:**
- [← Back to Overview](AI_EMAIL_CLIENT_PRD_OVERVIEW.md)
- [Feature Requirements](AI_EMAIL_CLIENT_PRD_FEATURES.md)
- [Technical Specifications](AI_EMAIL_CLIENT_PRD_TECHNICAL.md)
- [Data Models](AI_EMAIL_CLIENT_PRD_DATA_MODELS.md)
- **UI/UX Guidelines** (You are here)

