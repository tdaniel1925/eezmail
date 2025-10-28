# AUTHENTICATION TESTING GUIDE

## Quick Test Instructions

### 1. Apply Database Migration First

**IMPORTANT**: Run this before testing!

```bash
# Option A: Using psql directly
psql $DATABASE_URL -f migrations/001_fix_auth_and_user_data.sql

# Option B: Copy-paste SQL from migration file into your database client
```

---

### 2. Test Username Lookup (Forgot Username)

**URL**: http://localhost:3000/forgot-username

**Test Cases**:

| Email                      | Expected Result                      |
| -------------------------- | ------------------------------------ |
| `tdaniel@botmakers.ai`     | ✅ Shows username                    |
| `TDANIEL@BOTMAKERS.AI`     | ✅ Shows username (case-insensitive) |
| `TDaniel@BotMakers.AI`     | ✅ Shows username (mixed case)       |
| `tdaniel1925@easemail.com` | ✅ Shows username                    |
| `TDANIEL1925@EASEMAIL.COM` | ✅ Shows username (case-insensitive) |
| `nonexistent@test.com`     | ❌ Shows "No account found"          |

**How to Test**:

1. Open `/forgot-username`
2. Enter email address
3. Click "Find My Username"
4. Should see username displayed in a box
5. Try again with UPPERCASE version of same email
6. Should still work and show same username

---

### 3. Test Login

**URL**: http://localhost:3000/login

**Test Cases**:

Use the username you got from the lookup test above.

| Username             | Password           | Expected Result                          |
| -------------------- | ------------------ | ---------------------------------------- |
| (your username)      | (correct password) | ✅ Login success → redirect to dashboard |
| (UPPERCASE USERNAME) | (correct password) | ✅ Login success (case-insensitive)      |
| (MixedCase Username) | (correct password) | ✅ Login success                         |
| (your username)      | wrong_password     | ❌ Shows "Invalid username or password"  |
| nonexistent_user     | any_password       | ❌ Shows "Username not found"            |

**How to Test**:

1. Get username from forgot-username page
2. Open `/login`
3. Enter username (try different cases)
4. Enter password
5. Click "Login"
6. Should redirect to `/dashboard` if successful

---

### 4. Test Admin Panel (If you're an admin)

**URL**: http://localhost:3000/admin/users

**What to Check**:

✅ **User Table Should Show**:

- Email address (correct from database)
- Username (visible and correct)
- Full name (not blank or "undefined")
- Role (user/admin/super_admin)
- Tier (individual/team/enterprise)
- Created date

✅ **Search Should Work**:

- Search by email
- Search by username
- Search by name

---

## Debugging Failed Tests

### If Username Lookup Fails

1. **Check Server Logs**:

   ```
   Look for: [USERNAME LOOKUP] Looking up email: ...
   ```

2. **Check Console**:
   - Open browser DevTools → Console
   - Should see API request to `/api/auth/lookup-username`
   - Check response (should be 200 OK or 404 Not Found)

3. **Verify Email Exists**:
   ```sql
   SELECT email, username FROM users WHERE LOWER(email) LIKE '%tdaniel%';
   ```

---

### If Login Fails

1. **Check Server Logs**:

   ```
   Look for: [SERVER AUTH] Login attempt for username: ...
   Look for: [SERVER AUTH] Found email for username: ...
   ```

2. **Check Username Exists**:

   ```sql
   SELECT email, username FROM users WHERE LOWER(username) = 'your_username';
   ```

3. **Check Supabase Auth**:
   - Go to Supabase dashboard
   - Authentication → Users
   - Verify user exists there
   - Verify email matches database

---

### If Admin Panel Shows Wrong Data

1. **Check API Response**:
   - Open DevTools → Network
   - Refresh `/admin/users` page
   - Click on `/api/admin/users` request
   - Check Response tab
   - Verify `username` field is present

2. **Check Database**:

   ```sql
   SELECT id, email, username, name, full_name FROM users LIMIT 5;
   ```

3. **Check for Null Values**:
   ```sql
   SELECT
     COUNT(*) as total,
     COUNT(username) as has_username,
     COUNT(name) as has_name,
     COUNT(full_name) as has_full_name
   FROM users;
   ```

---

## What Fixed

### ✅ Case-Insensitive Lookups

**Before**:

```typescript
eq(users.email, email.toLowerCase()); // ❌ Only works if DB email is lowercase
```

**After**:

```typescript
sql`LOWER(${users.email}) = ${normalizedEmail}`; // ✅ Works with any case
```

### ✅ Complete User Data

**Before**:

```typescript
name: u.name; // ❌ Field didn't exist in schema
```

**After**:

```typescript
name: u.fullName || u.name || `${u.firstName} ${u.lastName}` || null; // ✅ Handles all cases
username: u.username; // ✅ Added to response
```

---

## Expected Log Output

### Successful Login:

```
[SERVER AUTH] Login attempt for username: tdaniel
[SERVER AUTH] Found email for username: tdaniel -> tdaniel@botmakers.ai
[SERVER AUTH] Login successful: tdaniel@botmakers.ai
[SERVER AUTH] Session created, redirecting to dashboard
```

### Successful Lookup:

```
[USERNAME LOOKUP] Looking up email: tdaniel@botmakers.ai
[USERNAME LOOKUP] Found username: tdaniel for email: tdaniel@botmakers.ai
```

### Failed Lookup (User Not Found):

```
[USERNAME LOOKUP] Looking up email: nonexistent@test.com
[USERNAME LOOKUP] No user found for email: nonexistent@test.com
[USERNAME LOOKUP] Available users (first 10): [...]
```

---

## Manual Database Verification

### Check User Exists:

```sql
SELECT * FROM users WHERE LOWER(email) = 'tdaniel@botmakers.ai';
```

### Check Username Set:

```sql
SELECT email, username, name, full_name, role
FROM users
WHERE LOWER(email) = 'tdaniel@botmakers.ai';
```

### Generate Username If Missing:

```sql
UPDATE users
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL OR username = '';
```

### Populate Name Field:

```sql
UPDATE users
SET name = COALESCE(full_name, CONCAT(first_name, ' ', last_name), email)
WHERE name IS NULL OR name = '';
```

---

## Success Checklist

- [ ] Database migration applied successfully
- [ ] Dev server running on http://localhost:3000
- [ ] Username lookup works for `tdaniel@botmakers.ai`
- [ ] Username lookup works for `tdaniel1925@easemail.com`
- [ ] Username lookup works with UPPERCASE emails
- [ ] Login works with correct username + password
- [ ] Login works with UPPERCASE username
- [ ] Login works with MixedCase username
- [ ] Admin panel shows complete user data
- [ ] Admin panel shows username column
- [ ] No console errors in browser
- [ ] No server errors in terminal

---

## Contact Support

If tests still fail after all fixes:

1. Share server logs from terminal
2. Share browser console errors
3. Share database query results
4. Confirm migration was applied

**All tests should pass if migration was applied and dev server restarted!**
