# Database Backup & Recovery Guide

## Overview

This guide documents the backup and recovery procedures for the EaseMail database.

## Automated Backups

### GitHub Actions Backup (Recommended)

- **Schedule**: Daily at 2 AM UTC
- **Retention**: 30 days in GitHub Artifacts
- **Location**: GitHub Actions → Workflows → "Database Backup"
- **Manual Trigger**: Available via "Run workflow" button

### Supabase Point-in-Time Recovery (PITR)

- **Location**: https://supabase.com/dashboard/project/hfduyqvdajtvnsldqmro/settings/addons
- **Retention**: Verify in Supabase dashboard (7 days free tier, 30 days pro tier)
- **Recovery**: Can restore to any point within retention period

## Manual Backup

### Create Backup Locally

```bash
npm run backup:db
```

This will:

1. Create a `backups/` directory in your project root
2. Generate a timestamped SQL file (e.g., `backup-2025-10-28.sql`)
3. Display backup size and location

### Backup File Location

Local backups are stored in: `backups/backup-YYYY-MM-DD.sql`

**Note**: Backup files are gitignored and not committed to the repository.

## Restore from Backup

### From GitHub Actions Artifact

1. Go to GitHub Actions → Workflows → "Database Backup"
2. Click on a successful workflow run
3. Download the backup artifact (30-day retention)
4. Extract the SQL file
5. Run restore command (see below)

### From Local Backup

```bash
psql "$DATABASE_URL" -f backups/backup-2025-10-28.sql
```

### From Supabase PITR

1. Go to Supabase Dashboard → Database → Backups
2. Select point-in-time to restore
3. Follow Supabase restore wizard
4. **Warning**: This will overwrite the current database

## Verification After Restore

After restoring a backup, verify data integrity:

```bash
# Connect to database
psql "$DATABASE_URL"

# Check table counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'email_accounts', COUNT(*) FROM email_accounts
UNION ALL
SELECT 'emails', COUNT(*) FROM emails
UNION ALL
SELECT 'email_threads', COUNT(*) FROM email_threads;

# Check recent data
SELECT created_at FROM users ORDER BY created_at DESC LIMIT 5;
```

## Backup Best Practices

### Before Major Changes

Always create a backup before:

- Running database migrations
- Bulk data updates
- Schema changes
- Major deployments

```bash
npm run backup:db
```

### Testing Backup Restore

Periodically test the restore process:

1. Create a test database
2. Restore a recent backup to test database
3. Verify data integrity
4. Document any issues

### Backup Storage

- **GitHub Actions**: 30-day retention (free)
- **Local**: Manual cleanup required (not in git)
- **Supabase**: Automatic (verify retention period)
- **External Storage** (Optional): Upload to AWS S3, Google Cloud Storage, or Azure Blob Storage for longer retention

## Emergency Recovery

### Complete Data Loss Scenario

1. **Identify last good backup**
   - Check GitHub Actions artifacts
   - Check Supabase PITR availability
   - Check local backups

2. **Prepare new database** (if needed)

   ```bash
   # Create new Supabase project or database
   # Update DATABASE_URL in environment
   ```

3. **Restore backup**

   ```bash
   psql "$DATABASE_URL" -f backups/backup-YYYY-MM-DD.sql
   ```

4. **Run migrations** (if backup is older than current schema)

   ```bash
   npm run db:migrate
   ```

5. **Verify application**
   - Test login
   - Check critical features
   - Verify recent data

## Monitoring & Alerts

### Check Backup Status

- **GitHub Actions**: Monitor workflow runs for failures
- **Supabase**: Check PITR status in dashboard
- **Local**: Verify backups directory exists and is populated

### Set Up Alerts (Recommended)

Add Slack/Discord webhook to GitHub Actions backup workflow to get notified on:

- Backup failures
- Backup success (daily confirmation)

## Emergency Contacts

- **Database Admin**: [Your Email]
- **Supabase Support**: https://supabase.com/dashboard/support
- **GitHub Support**: https://support.github.com

## Backup Schedule

| Backup Type    | Frequency        | Retention     | Location           |
| -------------- | ---------------- | ------------- | ------------------ |
| GitHub Actions | Daily (2 AM UTC) | 30 days       | GitHub Artifacts   |
| Supabase PITR  | Automatic        | 7-30 days     | Supabase Dashboard |
| Manual         | As needed        | Until deleted | Local `backups/`   |

## Recovery Time Objectives

- **Local Backup Restore**: ~5-10 minutes
- **GitHub Artifact Restore**: ~15-20 minutes (includes download time)
- **Supabase PITR Restore**: ~10-30 minutes (depending on database size)

## Notes

- Always test backups before relying on them in production
- Keep backup credentials secure
- Document any custom restore procedures
- Review backup strategy quarterly
- Consider increasing retention for production systems
