# 🚀 Quick Start: Tavily Internet Search

## Setup (2 minutes)

### 1. Add API Key to Environment

Open your `.env.local` file and add:

```bash
# Tavily API (Internet Search)
TAVILY_API_KEY=tvly-paste-your-api-key-here
```

### 2. Restart Dev Server

```bash
npm run dev
```

That's it! ✅

---

## Testing

### Test 1: General Knowledge (SHOULD trigger search)

1. Open AI chatbot in dashboard
2. Ask: **"What is quantum computing?"**
3. ✅ You should see toast: "🌐 Enhanced answer with internet search results"
4. ✅ AI provides detailed answer with context from the web

### Test 2: Email Question (should NOT trigger search)

1. Ask: **"Show me emails from yesterday"**
2. ✅ AI uses internal email search (no internet search)
3. ✅ Returns email results directly

### Test 3: Current Events

1. Ask: **"What's the latest news about AI?"**
2. ✅ Search triggered
3. ✅ AI provides recent information from the web

---

## How It Works

```
User: "What is blockchain?"
    ↓
AI: "I'm not sure about that..."
    ↓
System detects uncertainty
    ↓
Checks if it's general knowledge (yes)
    ↓
Searches Tavily
    ↓
Re-prompts AI with search results
    ↓
Returns: "Blockchain is a decentralized ledger technology..."
```

---

## Configuration

Edit `src/lib/search/tavily.ts` to customize:

- **Max Results**: Default 3 (line 40)
- **Search Depth**: 'basic' or 'advanced' (line 39)
- **Include Answer**: true/false (line 41)

---

## Troubleshooting

**"Tavily API key not configured"**

- Check `.env.local` has `TAVILY_API_KEY`
- Restart dev server

**Search not triggering**

- AI might be confident enough without search
- Try more obscure questions
- Check logs for "🔍 [Chat API] AI uncertain"

---

## Cost

- **Tavily**: $0.001 per search (1,000 free/month)
- **OpenAI**: Extra ~$0.03 per search (GPT-4 re-prompt)
- Only triggers when AI is uncertain

---

## Status: ✅ READY TO USE

Just add your API key and test!
