# 🔧 ngrok Free Plan Warning

## The Issue:

ngrok's free plan shows a **warning page** before forwarding to your app. This breaks the OAuth flow because Aurinko can't complete the redirect.

---

## ✅ Solution 1: Click "Visit Site" First

1. **Visit this URL first:**

   ```
   https://unnew-marina-busied.ngrok-free.dev
   ```

2. **Click "Visit Site"** on the ngrok warning page

3. **Then** visit the connect URL:
   ```
   https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/connect
   ```

---

## ✅ Solution 2: Upgrade ngrok (Recommended)

Get a free static domain from ngrok:

1. **Sign up at ngrok.com** (free account)
2. **Get your authtoken:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
3. **Start ngrok with a static domain:**
   ```bash
   ngrok http 3000 --domain=your-static-domain.ngrok-free.app
   ```

This removes the warning page and gives you a permanent URL!

---

## ✅ Solution 3: Use LocalTunnel (Alternative)

```bash
# Install
npm install -g localtunnel

# Run
lt --port 3000 --subdomain imbox-test
```

This gives you: `https://imbox-test.loca.lt`

Add this to Aurinko dashboard and `.env.local`

---

## 🎯 Quickest Fix:

Just visit the ngrok URL in your browser first, click "Visit Site", then try the OAuth flow again!

```
https://unnew-marina-busied.ngrok-free.dev/api/auth/aurinko/connect
```
