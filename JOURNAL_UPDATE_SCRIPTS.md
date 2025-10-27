# Migration Journal Update Scripts

These PowerShell scripts automate updating the Drizzle migration journal after running direct SQL migrations in Supabase.

## Why You Need This

When you run SQL migrations directly in Supabase (bypassing Drizzle Kit), you **must** update the Drizzle journal file (`drizzle/meta/_journal.json`). Otherwise:

- Vercel deployments will fail
- Drizzle will try to run the migration again
- You'll get enum conflicts and duplicate table errors

## Scripts Available

### 1. `quick-journal.ps1` - Simple & Fast ⚡

**Best for:** Quick updates when you know the migration name

```powershell
# Interactive - shows recent migrations
.\quick-journal.ps1

# Direct - provide migration name
.\quick-journal.ps1 -Name "0010_add_feature"
```

**What it does:**

1. Lists 5 most recent migration files
2. Adds entry to journal
3. Optionally commits & pushes to GitHub

### 2. `update-journal.ps1` - Full Featured 🎯

**Best for:** Complete workflow with validation and safety checks

```powershell
# Using migration file
.\update-journal.ps1 -MigrationFile "0010_add_feature.sql"

# Using migration name
.\update-journal.ps1 -MigrationName "0010_add_feature"

# Interactive mode
.\update-journal.ps1
```

**Features:**

- ✅ Validates migration file exists
- ✅ Checks for duplicate entries
- ✅ Shows detailed output with colors
- ✅ Confirms before committing
- ✅ Optional git push

## Complete Workflow

### After Running SQL in Supabase:

```powershell
# 1. Quick way (recommended)
.\quick-journal.ps1

# 2. Select the migration you just ran
[1] 0010_add_notification_system
[2] 0009_fix_notification_system
# Enter: 1

# 3. Confirm commit
✅ Added: idx=10, tag=0010_add_notification_system
Commit? (y/n): y

# 4. Confirm push
Push? (y/n): y
✅ Pushed!
```

### Manual Steps (if not using scripts):

1. Open `drizzle/meta/_journal.json`
2. Add new entry to `entries` array:

```json
{
  "idx": 10,
  "version": "7",
  "when": 1761538200000,
  "tag": "0010_your_migration_name",
  "breakpoints": true
}
```

3. Get timestamp: `[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()`
4. Commit both files together

## Migration Naming Convention

**Format:** `XXXX_descriptive_name.sql`

Examples:

- ✅ `0010_add_notification_tables.sql`
- ✅ `0011_fix_user_roles.sql`
- ✅ `0012_update_indexes.sql`
- ❌ `migration.sql` (no number)
- ❌ `10_add_tables.sql` (not 4 digits)

## Troubleshooting

### "Migration file not found"

- The script looks in `drizzle/` folder
- Make sure your `.sql` file is in the correct location

### "Migration already exists in journal"

- The full script will detect this and ask if you want to overwrite
- Use the quick script if you're sure it's not a duplicate

### "Invalid format"

- Migration names must follow: `XXXX_name_here` format
- Use 4 digits, underscore, then descriptive name

### Git errors

- Make sure you're in the project root directory
- Check that you have git configured

## Tips

1. **Always use the script** - It's faster and prevents mistakes
2. **Run immediately** after Supabase migration - Don't forget!
3. **Check Vercel** after pushing - Verify deployment succeeds
4. **Keep names descriptive** - Helps track what each migration does

## What Gets Committed

The scripts will commit:

- `drizzle/meta/_journal.json` (updated with new entry)
- `drizzle/XXXX_migration_name.sql` (if it exists)

## Example Session

```powershell
PS> .\quick-journal.ps1

Recent migrations:
  [1] 0010_add_notification_system
  [2] 0009_fix_notification_system
  [3] 0008_living_steve_rogers
  [4] 0007_many_gamora
  [5] 0006_careful_spectrum

Select [1-5] or enter name: 1

✅ Added: idx=10, tag=0010_add_notification_system

Commit? (y/n): y
[glassmorphic-redesign 43a9503] chore: update journal for 0010_add_notification_system
 2 files changed, 150 insertions(+)

Push? (y/n): y
To https://github.com/tdaniel1925/eezmail.git
   3cb055c..43a9503  glassmorphic-redesign -> glassmorphic-redesign
✅ Pushed!
```

## Integration with Workflow

### Recommended Process:

1. **Write SQL migration** in `drizzle/XXXX_name.sql`
2. **Test locally** (optional)
3. **Run in Supabase** SQL Editor
4. **Verify success** in Supabase
5. **Run script**: `.\quick-journal.ps1`
6. **Push to GitHub** (script will prompt)
7. **Verify Vercel** deployment succeeds

### One-Liner After Supabase:

```powershell
.\quick-journal.ps1 -Name "0010_my_migration" && git push
```

## Safety Features

Both scripts:

- ✅ Never delete existing entries (unless explicitly confirmed)
- ✅ Validate file formats
- ✅ Show what will be committed before committing
- ✅ Allow you to cancel at any point
- ✅ Preserve existing journal structure

## Need Help?

See `DIRECT_MIGRATION_WORKFLOW.md` for the complete guide on direct SQL migrations.

---

**Remember:** Every direct SQL migration in Supabase needs a journal update. Use these scripts to make it automatic! 🚀
