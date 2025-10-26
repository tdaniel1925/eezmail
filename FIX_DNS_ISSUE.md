# DNS Resolution Fix for Supabase Connection

## Problem

Your application cannot connect to Supabase because your DNS server cannot resolve:
`db.hfduyqvdajtvnsldqmro.supabase.co`

## Root Cause

- Your default DNS server (2001:558:feed::1) is not responding
- This appears to be your ISP's DNS server (likely Comcast/Xfinity based on the address)
- Google's public DNS (8.8.8.8) successfully resolves the hostname

## Solution 1: Change DNS Server (Recommended)

### On Windows:

1. **Open Network Settings**
   - Press `Win + R`
   - Type `ncpa.cpl` and press Enter

2. **Configure DNS**
   - Right-click your active network connection
   - Click "Properties"
   - Select "Internet Protocol Version 4 (TCP/IPv4)"
   - Click "Properties"

3. **Set DNS Servers**
   - Select "Use the following DNS server addresses"
   - **Preferred DNS**: `8.8.8.8` (Google)
   - **Alternate DNS**: `1.1.1.1` (Cloudflare)
   - Click OK

4. **Restart Network**

   ```powershell
   ipconfig /release
   ipconfig /renew
   ipconfig /flushdns
   ```

5. **Test Connection**
   ```bash
   nslookup db.hfduyqvdajtvnsldqmro.supabase.co
   ```

## Solution 2: Check VPN/Firewall

If you're using a VPN or corporate network:

- Disable VPN temporarily and test
- Check if firewall is blocking Supabase
- Whitelist `*.supabase.co` in your firewall

## Solution 3: Add to Hosts File (Temporary)

If you need immediate access:

1. Open PowerShell as Administrator
2. Edit hosts file:

   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. Add this line (using the IPv6 address from Google DNS):

   ```
   2600:1f18:2e13:9d2c:9591:5ab3:a5cc:23b9 db.hfduyqvdajtvnsldqmro.supabase.co
   ```

4. Save and close
5. Flush DNS again:
   ```powershell
   ipconfig /flushdns
   ```

## Solution 4: Restart Your Router

Sometimes ISP DNS servers have temporary issues:

1. Unplug your router/modem
2. Wait 30 seconds
3. Plug back in
4. Wait for full connection
5. Test again

## After Fixing

Once DNS is working, restart your development server:

```bash
npm run dev
```

Your application should now connect to Supabase successfully!

## Verification

Test that DNS is working:

```bash
# Should return an IP address
nslookup db.hfduyqvdajtvnsldqmro.supabase.co

# Should successfully connect
curl https://db.hfduyqvdajtvnsldqmro.supabase.co -I
```


