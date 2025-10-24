# Inngest Common Issues & Fixes

## Issue: "connect-gateway errored: could not listen for: bind: Only one usage of each socket address"

**What it means:**
This error appears when starting `npx inngest-cli@latest dev` and indicates that port 50052 is already in use by another process.

**Impact:**
✅ **NO IMPACT** - This only affects the gRPC gateway (advanced feature). Your email sync will work perfectly without it.

**What still works:**

- ✅ Inngest dashboard at http://localhost:8288
- ✅ Function execution
- ✅ Event sending
- ✅ Step-by-step workflows
- ✅ Retry logic
- ✅ All email sync functionality

**If you want to fix it (optional):**

### Windows:

```powershell
# Find what's using port 50052
netstat -ano | findstr :50052

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Restart Inngest
npx inngest-cli@latest dev
```

### Why it happens:

- Previous Inngest instance didn't close properly
- Another app is using port 50052
- Docker or WSL2 process using the port

**Recommended action:**
✅ **Ignore it** - Your email sync doesn't need the gRPC gateway. Everything else works perfectly.

---

## Other Common Inngest Issues

### Issue: Dashboard shows "No Functions"

**Solution:**

1. Make sure Next.js dev server is running (`npm run dev`)
2. Visit: http://localhost:3000/api/inngest (this registers functions)
3. Refresh Inngest dashboard

### Issue: Functions not triggering

**Solution:**

1. Check Inngest dev server is running
2. Check Next.js dev server is running
3. Check terminal for errors
4. Visit `/api/inngest` to re-register functions

### Issue: "Failed to connect to dev server"

**Solution:**

1. Restart Inngest dev server
2. Clear browser cache
3. Check firewall isn't blocking port 8288

---

**Current Status:**
✅ Inngest is running correctly at http://localhost:8288
✅ Email sync functionality is fully operational
✅ The gateway error can be safely ignored
