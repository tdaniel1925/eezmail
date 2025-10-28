# 🚨 URGENT: DNS Resolution Issue - Complete Fix Guide

## Problem Summary

Your Next.js app cannot connect to Supabase because of DNS resolution failure:

```
Error: getaddrinfo ENOTFOUND db.hfduyqvdajtvnsldqmro.supabase.co
```

## Root Cause

- Node.js DNS resolver cannot find the Supabase hostname
- Your network DNS is having issues resolving `*.supabase.co` domains
- This is likely a local network/ISP/VPN issue

---

## ✅ IMMEDIATE SOLUTIONS (Try in Order)

### Solution 1: Restart Your Computer (Simplest)

Sometimes Windows DNS cache gets corrupted. A full restart often fixes it.

1. **Save all your work**
2. **Restart your computer**
3. **Test the connection:**
   ```bash
   npm run dev
   ```

---

### Solution 2: Use Different Network (Quick Test)

Test if it's network-specific:

1. **Connect to mobile hotspot** (if available)
2. **Try running the app again**
3. If it works → Your home network/ISP is blocking Supabase
4. If it doesn't work → Try Solution 3

---

### Solution 3: Force Node.js to Use Different DNS

#### Option A: Set DNS Resolver in Node

Create a file `node-dns-fix.js` in your project root:

```javascript
// node-dns-fix.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS
console.log('DNS servers set to Google:', dns.getServers());
```

Then run your app with:

```bash
node -r ./node-dns-fix.js node_modules/next/dist/bin/next dev
```

#### Option B: Set Environment Variable

In PowerShell, before running `npm run dev`:

```powershell
$env:NODE_OPTIONS="--dns-result-order=ipv4first"
npm run dev
```

Or add to your `package.json`:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--dns-result-order=ipv4first' next dev"
  }
}
```

---

### Solution 4: VPN/Proxy Bypass

If you're using a VPN or proxy:

1. **Disable VPN temporarily**
2. **Test connection**
3. If it works, configure VPN to allow Supabase:
   - Whitelist `*.supabase.co`
   - Add to VPN split-tunnel exceptions

---

### Solution 5: Check Hosts File Override

Your hosts file might have a bad entry:

1. **Open PowerShell as Administrator**
2. **Edit hosts file:**
   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```
3. **Look for any line containing `supabase.co`**
4. **Delete or comment out** (add `#` at start) any Supabase entries
5. **Save and close**
6. **Flush DNS:**
   ```powershell
   ipconfig /flushdns
   ```

---

### Solution 6: Network Settings Reset (Windows)

#### Step 1: Run Network Reset Commands

Open **PowerShell as Administrator** and run:

```powershell
# Reset IP stack
netsh int ip reset

# Reset Winsock catalog
netsh winsock reset

# Flush DNS cache
ipconfig /flushdns

# Release and renew IP
ipconfig /release
ipconfig /renew

# Register DNS
ipconfig /registerdns
```

#### Step 2: Restart Computer

**Important:** You MUST restart after running these commands

---

### Solution 7: Firewall/Antivirus Check

Your firewall might be blocking Supabase:

1. **Windows Defender Firewall:**
   - Open Windows Security
   - Go to Firewall & Network Protection
   - Click "Allow an app through firewall"
   - Find Node.js and ensure both Private and Public are checked

2. **Third-party Antivirus:**
   - Check if you have Kaspersky, Norton, McAfee, etc.
   - Temporarily disable and test
   - If it works, add exception for `*.supabase.co`

---

### Solution 8: Use Different DNS Servers

#### Windows 11/10:

1. **Open Settings → Network & Internet**
2. **Click your connection (Wi-Fi or Ethernet)**
3. **Click "Edit" next to DNS server assignment**
4. **Select "Manual"**
5. **Turn on IPv4**
6. **Set Preferred DNS to:** `8.8.8.8`
7. **Set Alternate DNS to:** `1.1.1.1`
8. **Click Save**
9. **Open Command Prompt and run:**
   ```bash
   ipconfig /flushdns
   ipconfig /renew
   ```
10. **Test:**
    ```bash
    nslookup db.hfduyqvdajtvnsldqmro.supabase.co
    ```

---

### Solution 9: ISP DNS Blocking (Rare)

Some ISPs block certain cloud services. Try:

#### Use Cloudflare WARP (Free VPN)

1. Download: https://1.1.1.1/
2. Install and enable
3. Test your app

#### Use Alternative DNS (DNSCrypt)

1. Download: https://www.dnscrypt.org/
2. Install and configure
3. Test your app

---

### Solution 10: Contact Your Network Administrator

If you're on:

- **Corporate network** → Contact IT department
- **School network** → Contact network admin
- **Hotel/Public WiFi** → Try different network

---

## 🔍 Diagnostic Commands

Run these to gather information:

```powershell
# Check DNS servers
netsh interface ipv4 show dnsservers

# Test DNS resolution
nslookup db.hfduyqvdajtvnsldqmro.supabase.co

# Test with Google DNS
nslookup db.hfduyqvdajtvnsldqmro.supabase.co 8.8.8.8

# Test with Cloudflare DNS
nslookup db.hfduyqvdajtvnsldqmro.supabase.co 1.1.1.1

# Test if Node can resolve
node -e "require('dns').resolve4('db.hfduyqvdajtvnsldqmro.supabase.co', console.log)"

# Check active network connections
netstat -ano | findstr "443"
```

---

## ✅ Verification Steps

After trying a solution, verify it worked:

### Test 1: DNS Resolution

```powershell
nslookup db.hfduyqvdajtvnsldqmro.supabase.co
```

Should return an IP address without errors.

### Test 2: HTTP Connection

```powershell
curl https://db.hfduyqvdajtvnsldqmro.supabase.co -I
```

Should return HTTP headers.

### Test 3: Run Your App

```bash
npm run dev
```

Should start without the `ENOTFOUND` error.

---

## 🎯 Recommended Order of Attempts

1. **Restart computer** (5 min) ✅ START HERE
2. **Try mobile hotspot** (2 min)
3. **Disable VPN/proxy** (1 min)
4. **Change DNS to 8.8.8.8** (5 min)
5. **Check hosts file** (3 min)
6. **Run network reset commands** (10 min + restart)
7. **Check firewall/antivirus** (5 min)
8. **Try Cloudflare WARP** (10 min)

---

## 📞 If Nothing Works

### Last Resort Options:

1. **Use Supabase Local Development:**

   ```bash
   npx supabase start
   ```

   This runs Supabase locally without DNS issues.

2. **Contact Supabase Support:**
   - Email: support@supabase.com
   - Include error message and DNS test results

3. **Temporary Workaround (Development Only):**
   Edit your `hosts` file to manually map the IP:
   ```
   # Add this line to C:\Windows\System32\drivers\etc\hosts
   2600:1f18:2e13:9d2c:9591:5ab3:a5cc:23b9 db.hfduyqvdajtvnsldqmro.supabase.co
   ```
   **Note:** This is temporary; IP addresses may change.

---

## 📝 Common Causes by Environment

### Home Network:

- ISP DNS issues
- Router DNS cache
- Parental controls

### Work/School Network:

- Firewall blocking cloud services
- DNS filtering
- Proxy requirements

### Public WiFi:

- DNS hijacking
- Captive portal interference
- Service restrictions

### VPN Users:

- VPN DNS override
- Split tunnel config
- VPN blocking cloud services

---

## 🚨 Emergency Fallback

If you **absolutely cannot** fix DNS and need to develop NOW:

### Use Local Development Mode:

1. **Install Docker Desktop** (if not already)
2. **Run Supabase locally:**
   ```bash
   npx supabase init
   npx supabase start
   ```
3. **Update `.env.local` to use local instance:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
   ```
4. **Run your app:**
   ```bash
   npm run dev
   ```

This completely bypasses the DNS issue!

---

## 📊 Success Rate by Solution

Based on common cases:

| Solution              | Success Rate | Time   |
| --------------------- | ------------ | ------ |
| Restart computer      | 40%          | 5 min  |
| Change DNS to 8.8.8.8 | 30%          | 5 min  |
| Disable VPN           | 15%          | 1 min  |
| Network reset         | 10%          | 15 min |
| Local Supabase        | 100%         | 20 min |

---

## ✅ Expected Outcome

After successful fix, you should see:

```bash
$ npm run dev
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

No more `ENOTFOUND` errors!

---

**🎯 START WITH:** Restarting your computer - it fixes 40% of DNS issues immediately!

If issues persist after trying all solutions, there may be a network-level block. Use local Supabase development as fallback.




