# Writing Features Setup Guide 🔧

## Prerequisites

To use the AI-powered writing features (Check Writing & Smart Compose), you need to configure an OpenAI API key.

## Step 1: Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the API key (you won't be able to see it again!)

## Step 2: Add API Key to Environment

1. Open your `.env.local` file in the project root
2. Add the following line:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Save the file

## Step 3: Restart the Server

```bash
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

## Step 4: Enable Smart Compose (Optional)

Smart Compose is disabled by default. To enable it:

1. Open `src/components/email/EmailComposer.tsx`
2. Find this line:
   ```typescript
   const [enableSmartCompose, setEnableSmartCompose] = useState(false);
   ```
3. Change it to:
   ```typescript
   const [enableSmartCompose, setEnableSmartCompose] = useState(true);
   ```
4. Save the file

## Features Available

### Without OpenAI API Key:

- ✅ **Native Spell Check** - Works automatically (browser built-in)
- ✅ **All other composer features** - Attachments, templates, emoji, etc.

### With OpenAI API Key:

- ✅ **Native Spell Check** - Works automatically
- ✅ **AI Check Writing** - Grammar, style, clarity analysis
- ✅ **Smart Compose** - Predictive text suggestions (if enabled)

## Testing the Features

### Test Native Spell Check:

1. Open composer
2. Type: "I recieve youre email"
3. See red underlines on misspelled words

### Test AI Check Writing:

1. Open composer
2. Type: "I recieve you're email and will reviw it tommorow. Looking forward to here from you."
3. Click **"Check Writing"** button
4. Review AI suggestions for spelling, grammar, and style

### Test Smart Compose (if enabled):

1. Open composer
2. Type: "Thank you for your email. I will review the document and"
3. Wait 1 second
4. See suggestion popup appear
5. Press `Tab` to accept first suggestion

## Troubleshooting

### "OpenAI API key not configured" error:

- Make sure `.env.local` has `OPENAI_API_KEY=sk-...`
- Restart the dev server after adding the key
- Check the key is valid at [platform.openai.com](https://platform.openai.com)

### "Failed to fetch" error:

- Check if the dev server is running
- Clear browser cache and refresh
- Check browser console for detailed error messages

### Smart Compose not appearing:

- Make sure it's enabled in `EmailComposer.tsx`
- Type at least 10 characters
- Don't end sentences with punctuation (it only suggests mid-sentence)
- Wait 1 second after stopping typing

### Check Writing button disabled:

- Make sure you've typed some text in the email body
- The button is disabled when the body is empty

## API Usage & Costs

### Check Writing:

- **Model**: GPT-4
- **When**: Only when you click the button
- **Cost**: ~$0.03-0.06 per check (typical email)

### Smart Compose:

- **Model**: GPT-3.5-turbo
- **When**: Every time you pause typing (1 second delay)
- **Cost**: ~$0.002 per suggestion
- **Recommendation**: Use sparingly or disable if not needed

### Cost Management Tips:

1. Keep Smart Compose disabled if you don't need it
2. Use Check Writing only on important emails
3. Set usage limits in your OpenAI account dashboard
4. Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage)

## Alternative: Use Without AI Features

The composer works great without AI features! You'll still have:

- Native browser spell check (free)
- Rich text formatting
- File attachments
- Emoji picker
- Email templates
- Voice dictation
- AI Remix (uses chat API if configured)
- Email scheduling
- Auto-save drafts

## Need Help?

Check the main documentation:

- `WRITING_FEATURES_ADDED.md` - Feature overview
- `SETUP_GUIDE.md` - General project setup
- `AI_EMAIL_CLIENT_PRD_OVERVIEW.md` - Product overview

Happy writing! ✍️✨
