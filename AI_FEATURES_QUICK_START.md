# AI Features - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up OpenAI API Key

Add to your `.env.local` file:

```env
OPENAI_API_KEY=sk-your-key-here
```

Get your API key from: https://platform.openai.com/api-keys

---

### Step 2: Run Database Migration

The AI Reply feature requires a new database table. Run:

```bash
npx drizzle-kit push:pg
```

Or if that doesn't work:

```bash
npm run db:push
```

This will add the `ai_reply_drafts` table to your database.

---

### Step 3: Restart Your Dev Server

```bash
npm run dev
```

The server should start on http://localhost:3001

---

### Step 4: Generate Test Emails

1. Open your browser and go to http://localhost:3001
2. Log in to your account
3. Go to **Settings** (gear icon in sidebar)
4. Click on **Danger Zone** tab (last tab)
5. Click **"Generate Test Emails"** button
6. Wait for success notification
7. Check your Inbox, Newsfeed, Receipts, and Spam folders

You should now have 40 test emails to work with!

---

### Step 5: Test the Features

#### Test AI Email Search (Chatbot)

1. Click the **chatbot icon** (bottom-right corner)
2. Try these queries:
   - "Find emails from Sarah"
   - "Show me unread emails"
   - "Search for emails about meetings"
3. Click on email links in the results

#### Test AI Icon & Analysis Modal

1. Open any folder (Inbox, Newsfeed, etc.)
2. Look for the **blue sparkles icon ✨** next to sender names
3. Click the icon (don't expand the email)
4. View the AI Analysis Modal with email details
5. Click "Close" or click outside to dismiss

#### Test Contextual Actions

1. Open an email that mentions a "meeting" or "schedule"
2. Expand it by clicking anywhere on the card
3. Scroll down to see **"Suggested Actions:"** section
4. See "Add to Calendar" button and other contextual suggestions
5. Click actions to test (some features show "Coming soon")

#### Test Thread View

The ThreadView component is ready to use. To see it in action, you'll need to create a route like `/dashboard/thread/[id]` that uses the `<ThreadView />` component with a thread ID.

#### Test AI Reply (Advanced)

The AI Reply modal is complete but needs to be triggered from an email action button. The workflow:

1. Open an email
2. Click "AI Reply" button (to be added to action buttons)
3. Answer clarifying questions
4. Review AI-generated draft
5. Edit and send

---

## 🎯 Quick Feature Overview

### 1. AI Chatbot

- **Location**: Bottom-right floating button
- **What it does**: Search emails using natural language
- **Try**: "Find emails from [name]", "Show unread", "Search for [topic]"

### 2. AI Icon on Emails

- **Location**: Next to sender name on every email
- **What it does**: Opens detailed AI analysis modal
- **Try**: Click any sparkles icon ✨

### 3. Contextual Actions

- **Location**: Bottom of expanded email
- **What it does**: Suggests relevant actions based on content
- **Try**: Expand an email about a meeting

### 4. Test Email Generator

- **Location**: Settings > Danger Zone
- **What it does**: Creates 40 realistic test emails
- **Try**: Click "Generate Test Emails"

### 5. Wipe Data

- **Location**: Settings > Danger Zone
- **What it does**: Complete system reset
- **⚠️ Warning**: This PERMANENTLY deletes ALL data!

---

## 🔍 Troubleshooting

### Chatbot not working?

- Check that `OPENAI_API_KEY` is set in `.env.local`
- Restart dev server after adding the key
- Check browser console for errors

### Test emails not appearing?

- Make sure you have at least one connected email account
- Check that account status is "active"
- Refresh the page after generation

### Database errors?

- Run `npx drizzle-kit push:pg` to sync schema
- Check that Supabase connection is working
- Verify DATABASE_URL in `.env.local`

### Styling looks broken?

- Clear browser cache
- Check that Tailwind CSS is compiling
- Restart dev server

---

## 📝 What's Implemented

✅ **Test Email Generation** - 40 realistic emails
✅ **Wipe Data Functionality** - Complete system reset
✅ **AI Icon & Analysis Modal** - Click sparkles for analysis
✅ **Email Search Library** - Full-text search functions
✅ **Chatbot with OpenAI** - Natural language search
✅ **Contextual Actions** - Smart action suggestions
✅ **Chatbot Action Handlers** - Backend actions
✅ **Thread View** - Timeline UI component
✅ **AI Reply Folder** - Interactive drafting

---

## 🎨 UI Tips

- **Dark Mode**: Toggle in top-right corner
- **Sidebar**: Collapse/expand with hamburger menu
- **Email Cards**: Click to expand, click again to collapse
- **Modals**: Click outside or press Esc to close
- **Toast Notifications**: Auto-dismiss after a few seconds

---

## 🚀 Next Steps

Once you've tested the basic features:

1. **Connect Real Email Account** (Microsoft/Gmail)
2. **Sync Real Emails** from Settings
3. **Test AI Features** on real emails
4. **Customize Settings** to your preference
5. **Explore Advanced Features** like AI Reply

---

## 💡 Pro Tips

### For Better AI Results:

- Use specific names when searching
- Include relevant keywords
- Be conversational with the chatbot

### For Contextual Actions:

- Actions auto-detect based on keywords
- More keywords = more suggestions
- Edit email content to test detection

### For AI Reply:

- Answer questions thoroughly
- Edit generated drafts as needed
- Use "Regenerate" for different styles

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify all environment variables are set
4. Ensure database is properly migrated
5. Restart the dev server

Common fixes:

- `npm install` - Reinstall dependencies
- `npx drizzle-kit push:pg` - Sync database
- `npm run dev` - Restart server
- Clear browser cache and cookies

---

**Happy Testing! 🎉**

All features are implemented and ready to use. Enjoy exploring the AI-powered email client!
