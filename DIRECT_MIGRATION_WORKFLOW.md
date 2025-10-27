# Direct SQL Migration Workflow

## When to Use Direct Migrations

Use direct SQL migrations in Supabase SQL Editor when:
- Drizzle Kit is too slow (large database)
- Enum conflicts occur with `drizzle-kit migrate`
- You need to run custom SQL that Drizzle doesn't generate
- Emergency hotfixes in production

## The Process (Every Time)

### Step 1: Create the SQL Migration File

Place your migration in the `drizzle/` folder with proper naming:
```
drizzle/XXXX_descriptive_name.sql
```

Example: `drizzle/0009_fix_notification_system.sql`

**Important:** Always use safe SQL patterns:
```sql
-- Safe enum creation (won't fail if already exists)
DO $$ BEGIN
  CREATE TYPE my_enum AS ENUM ('value1', 'value2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Safe table creation
CREATE TABLE IF NOT EXISTS my_table (...);

-- Safe index creation
CREATE INDEX IF NOT EXISTS my_index ON my_table(column);
```

### Step 2: Run in Supabase SQL Editor

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the entire contents of your migration file
4. Paste and click **Run** (or Ctrl+Enter)
5. Verify success message appears

### Step 3: Update Drizzle Journal (CRITICAL)

**This step prevents Vercel build failures!**

Edit `drizzle/meta/_journal.json` and add a new entry:

```json
{
  "idx": 9,  // Increment from the last entry
  "version": "7",
  "when": 1761538200000,  // Current timestamp (milliseconds)
  "tag": "0009_fix_notification_system",  // Your migration name
  "breakpoints": true
}
```

**Pro tip:** Get current timestamp in PowerShell:
```powershell
[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
```

### Step 4: Update Snapshot (Optional but Recommended)

Generate a new Drizzle snapshot to match your database:
```bash
npx drizzle-kit generate
```

This creates a new snapshot file in `drizzle/meta/` that matches your current schema.

### Step 5: Commit All Files

Commit these files together:
```
git add drizzle/XXXX_your_migration.sql
git add drizzle/meta/_journal.json
git add drizzle/meta/XXXX_snapshot.json  # If generated
git commit -m "feat: add notification system tables via direct migration"
```

### Step 6: Verify on Deploy

After pushing to Vercel:
1. Check that the build succeeds
2. Verify the migration doesn't run again
3. Test the new tables/features work

## Why This Is Necessary

### The Problem
- Drizzle tracks which migrations have been applied via `_journal.json`
- When you run SQL directly in Supabase, Drizzle doesn't know about it
- During Vercel build, Drizzle sees the SQL file and tries to run it again
- This causes **enum conflicts, duplicate table errors, and build failures**

### The Solution
- Updating `_journal.json` tells Drizzle "this migration is already applied"
- Drizzle skips it during builds
- Your deployments succeed

## Common Mistakes to Avoid

❌ **DON'T:**
- Run direct SQL without updating `_journal.json`
- Forget to increment the `idx` number
- Use duplicate timestamps
- Skip committing the journal update

✅ **DO:**
- Always update the journal immediately after running SQL
- Use safe SQL patterns (`IF NOT EXISTS`, exception handling)
- Test locally before deploying
- Keep migration files in the `drizzle/` folder

## Quick Reference Checklist

Every time you run a direct SQL migration:

- [ ] Create `.sql` file in `drizzle/` folder
- [ ] Run SQL in Supabase SQL Editor
- [ ] Verify success in Supabase
- [ ] Add entry to `drizzle/meta/_journal.json`
- [ ] (Optional) Run `npx drizzle-kit generate` for new snapshot
- [ ] Commit all files together
- [ ] Push and verify Vercel build succeeds

## Example: Complete Workflow

```bash
# 1. Create migration file
# (Edit drizzle/0010_add_new_feature.sql)

# 2. Run in Supabase SQL Editor
# (Copy, paste, execute)

# 3. Update journal
# (Edit drizzle/meta/_journal.json, add entry)

# 4. Optional: Generate new snapshot
npx drizzle-kit generate

# 5. Commit everything
git add drizzle/0010_add_new_feature.sql
git add drizzle/meta/_journal.json
git add drizzle/meta/0010_snapshot.json
git commit -m "feat: add new feature tables"

# 6. Push to GitHub
git push origin your-branch

# 7. Verify Vercel build succeeds
# (Check Vercel dashboard)
```

## Troubleshooting

### "Migration already applied" error on Vercel
- You forgot to update `_journal.json`
- **Fix:** Add the entry and redeploy

### "Enum already exists" error
- Your SQL doesn't use safe patterns
- **Fix:** Wrap enum creation in `DO $$ BEGIN ... EXCEPTION` block

### Journal has wrong `idx` number
- You used a duplicate or skipped number
- **Fix:** Make sure `idx` increments sequentially (0, 1, 2, 3...)

### Can't find migration file during build
- File name doesn't match journal entry
- **Fix:** Ensure `tag` in journal matches filename exactly

---

**Remember:** Direct migrations are powerful but require manual journal updates. Always do Steps 1-5 together!

_Context improved by Giga AI - Information used: Drizzle migration tracking, Vercel deployment workflows, PostgreSQL best practices_

