# ⚠️ IMPORTANT: Fix your .env.local file

## Problem:

Your `.env.local` has a duplicate on the last line:

```
AURINKO_REDIRECT_URI=   AURINKO_REDIRECT_URI=https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback
```

## Fix:

Replace that line with:

```
AURINKO_REDIRECT_URI=https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback
```

---

## Steps:

1. Open `.env.local` in your editor
2. Find the last line (the Aurinko redirect URI)
3. Replace it with:
   ```
   AURINKO_REDIRECT_URI=https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/callback
   ```
4. Save the file
5. Restart the dev server:
   ```bash
   # Kill the current server (Ctrl+C in terminal)
   npm run dev
   ```

---

## Then test:

Visit: `https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/connect`

🚀 This should work after fixing the duplicate!
