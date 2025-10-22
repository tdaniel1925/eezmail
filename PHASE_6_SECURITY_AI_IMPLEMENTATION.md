# 🛡️ Security AI Implementation - COMPLETE GUIDE

**Time**: 1-2 hours  
**Priority**: ⭐⭐⭐⭐⭐ CRITICAL  
**Backend**: Already exists (394 lines in `phishing-detector.ts`)

---

## What This Adds

- ✅ Automatic phishing detection on every synced email
- ✅ Security warnings for suspicious emails
- ✅ Risk levels: low, medium, high, critical
- ✅ Actionable recommendations
- ✅ Link analysis and sender verification

---

## Step 1: Add Phishing Detection to IMAP Sync (45 mins)

**File**: `src/lib/sync/providers/imap-sync-service.ts`

**Location**: After saving email to database (around line 250-300)

**Find this section**:

```typescript
// Save email to database
const [savedEmail] = await db
  .insert(emails)
  .values({
    // ... email data
  })
  .returning();
```

**Add after it**:

```typescript
// Security AI: Detect phishing
try {
  const { detectPhishing } = await import('@/lib/security/phishing-detector');

  const securityAnalysis = await detectPhishing({
    fromAddress: email.from,
    subject: email.subject || '',
    bodyText: email.bodyText || '',
    bodyHtml: email.bodyHtml || '',
    links: extractLinks(email.bodyHtml || email.bodyText || ''),
    headers: email.headers || {},
  });

  // Save security analysis if risk is high or critical
  if (
    securityAnalysis.riskLevel === 'high' ||
    securityAnalysis.riskLevel === 'critical'
  ) {
    await db
      .update(emails)
      .set({
        securityAnalysis: JSON.stringify(securityAnalysis) as any,
      })
      .where(eq(emails.id, savedEmail.id));

    console.log(`🛡️  High-risk email detected: ${email.subject}`);
  }
} catch (error) {
  console.error('Phishing detection error:', error);
  // Don't block sync on detection failure
}
```

**Add helper function** at the bottom of the file:

```typescript
function extractLinks(content: string): string[] {
  if (!content) return [];

  // Extract from HTML href attributes
  const hrefRegex = /href=["']([^"']+)["']/g;
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;

  const links = new Set<string>();

  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    links.add(match[1]);
  }
  while ((match = urlRegex.exec(content)) !== null) {
    links.add(match[0]);
  }

  return Array.from(links);
}
```

---

## Step 2: Add Security Banner to Email Viewer (30 mins)

**File**: `src/components/email/EmailViewer.tsx`

**Add import** at top:

```typescript
import { PhishingAlert } from '@/components/security/PhishingAlert';
```

**Find the email content section** (around line 150-200), before the email body:

**Add this**:

```typescript
{/* Security Warning Banner */}
{email.securityAnalysis && (() => {
  try {
    const analysis = typeof email.securityAnalysis === 'string'
      ? JSON.parse(email.securityAnalysis)
      : email.securityAnalysis;

    return (
      <div className="mb-4">
        <PhishingAlert
          riskLevel={analysis.riskLevel}
          indicators={analysis.indicators}
          recommendation={analysis.recommendation}
        />
      </div>
    );
  } catch (error) {
    console.error('Error parsing security analysis:', error);
    return null;
  }
})()}
```

---

## Step 3: Verify PhishingAlert Component Exists

The component already exists at: `src/components/security/PhishingAlert.tsx`

If it doesn't exist, create it:

```typescript
'use client';

import { AlertTriangle, Shield, ShieldAlert, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PhishingAlertProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  recommendation: string;
}

export function PhishingAlert({
  riskLevel,
  indicators,
  recommendation,
}: PhishingAlertProps) {
  const config = {
    low: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
      title: 'Security Notice',
    },
    medium: {
      icon: Shield,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
      title: 'Security Warning',
    },
    high: {
      icon: ShieldAlert,
      className: 'border-orange-200 bg-orange-50 text-orange-900',
      title: '⚠️ High Risk Email',
    },
    critical: {
      icon: AlertTriangle,
      className: 'border-red-200 bg-red-50 text-red-900',
      title: '🚨 Critical Security Threat',
    },
  };

  const { icon: Icon, className, title } = config[riskLevel];

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-bold">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p className="font-medium">{recommendation}</p>
        {indicators.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Warning Signs:</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              {indicators.map((indicator, index) => (
                <li key={index}>{indicator}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Step 4: Run Database Migration (5 mins)

If you haven't already, run in Supabase SQL Editor:

```sql
-- migrations/add_ai_features_columns.sql
ALTER TABLE emails ADD COLUMN IF NOT EXISTS security_analysis JSONB;

CREATE INDEX IF NOT EXISTS idx_emails_security_analysis
ON emails USING GIN(security_analysis) WHERE security_analysis IS NOT NULL;
```

---

## Step 5: Test (15 mins)

1. **Restart dev server**:

```bash
npm run dev
```

2. **Trigger email sync**:
   - Go to inbox
   - Click sync button
   - Wait for emails to load

3. **Look for phishing warnings**:
   - Open suspicious-looking emails
   - Check for security banner
   - Verify risk levels are displayed

4. **Test scenarios**:
   - Known phishing email (if you have one)
   - Legitimate email (should have no banner)
   - Email with suspicious links

---

## Expected Behavior

### When Opening Safe Email:

- No security banner
- Normal email display

### When Opening Suspicious Email:

- 🟡 Yellow warning banner for medium risk
- 🟠 Orange banner for high risk
- 🔴 Red banner for critical risk
- Lists warning signs
- Shows recommendation

### In Database:

- `emails.security_analysis` column populated for risky emails
- JSON format: `{ riskLevel, indicators, recommendation, score }`

---

## Verification Queries

**Check analyzed emails**:

```sql
SELECT
  id,
  subject,
  security_analysis->>'riskLevel' as risk_level,
  security_analysis->>'score' as score
FROM emails
WHERE security_analysis IS NOT NULL
ORDER BY (security_analysis->>'score')::int DESC
LIMIT 10;
```

**Count by risk level**:

```sql
SELECT
  security_analysis->>'riskLevel' as risk_level,
  COUNT(*) as count
FROM emails
WHERE security_analysis IS NOT NULL
GROUP BY security_analysis->>'riskLevel'
ORDER BY count DESC;
```

---

## Troubleshooting

### No warnings appearing?

1. Check console for `🛡️  High-risk email detected` logs
2. Verify `phishing-detector.ts` is accessible
3. Check database for `security_analysis` column
4. Test with known spam/phishing email

### Errors in console?

1. Check import paths are correct
2. Verify `PhishingAlert` component exists
3. Check JSON parsing in EmailViewer

### Performance issues?

- Phishing detection runs async, doesn't block sync
- Only stores high/critical risks
- Uses efficient heuristics + AI

---

## What Gets Detected

The phishing detector checks for:

1. **Suspicious links**: Shortened URLs, mismatched domains
2. **Sender spoofing**: Display name vs email mismatch
3. **Urgent language**: "Act now", "Verify account"
4. **Requests for**: Passwords, credit cards, SSN
5. **Poor grammar**: Typos, awkward phrasing
6. **Suspicious attachments**: .exe, .scr files
7. **Domain reputation**: Known bad domains

**AI Enhancement**: Uses GPT to analyze subtle phishing attempts

---

## Next Steps

Once Security AI is working:

1. ✅ Deploy to production (critical security feature)
2. Monitor detected threats in analytics
3. Add user feedback ("Was this helpful?")
4. Fine-tune detection thresholds
5. Move to next feature (Analytics Dashboard)

---

**Estimated Time**: 1-2 hours  
**Difficulty**: Medium  
**Value**: ⭐⭐⭐⭐⭐ Critical  
**Status**: Ready to implement

---

_Implementation guide for Security AI feature complete._
