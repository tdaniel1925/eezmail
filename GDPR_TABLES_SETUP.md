# GDPR Tables Setup Instructions

## The GDPR Privacy page needs two database tables. Here are 3 ways to create them:

---

## ✅ **Option 1: SQL Editor in Supabase Dashboard (EASIEST)**

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Create data_export_requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  download_url TEXT,
  error_message TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for data_export_requests
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id
ON data_export_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_status
ON data_export_requests(status);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at
ON data_export_requests(requested_at DESC);

-- Create data_deletion_requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  deletion_report JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for data_deletion_requests
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id
ON data_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status
ON data_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at
ON data_deletion_requests(requested_at DESC);
```

5. Click **Run** (or press F5)
6. Refresh the GDPR Privacy page

---

## ✅ **Option 2: Drizzle Kit Push (RECOMMENDED)**

```bash
npx drizzle-kit push
```

Wait for it to complete, then refresh the page.

---

## ✅ **Option 3: Node Script**

```bash
node scripts/create-gdpr-tables.js
```

---

## 🔍 **Verify Tables Were Created**

In Supabase Dashboard → Table Editor, you should see:

- `data_export_requests`
- `data_deletion_requests`

---

## 📝 **What These Tables Do**

### `data_export_requests`

Tracks GDPR Article 15 requests (Right to Access)

- Users can request a complete export of their data
- Exports are generated as ZIP files
- Download links expire after 7 days

### `data_deletion_requests`

Tracks GDPR Article 17 requests (Right to be Forgotten)

- Users can request their data be deleted
- 30-day grace period before deletion
- Can be cancelled during grace period
- Audit logs are anonymized (not deleted)

---

## ✅ **Once Tables Are Created**

The GDPR Privacy page will work perfectly:

- View all export requests
- Download completed data exports
- View all deletion requests
- Cancel pending deletions
- Search by user email
- Real-time status tracking

The API now handles missing tables gracefully, so the page won't crash even if tables don't exist yet - it will just show "No requests found".
