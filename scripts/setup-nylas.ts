/**
 * Nylas Setup Validator & Configuration Helper
 * 
 * This script checks all Nylas prerequisites and guides you through setup
 * to avoid the configuration hell from last time.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

interface SetupCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  fix?: string;
}

const checks: SetupCheck[] = [];

console.log('🔍 Nylas Configuration Validator\n');
console.log('=' .repeat(60));

// ============================================================================
// STEP 1: Check Environment Variables
// ============================================================================

console.log('\n📋 Step 1: Checking Environment Variables...\n');

const requiredEnvVars = [
  {
    key: 'NYLAS_API_KEY',
    description: 'Your Nylas API key (starts with nylas_)',
    where: 'Nylas Dashboard → API Keys',
  },
  {
    key: 'NYLAS_API_URI',
    description: 'Nylas API endpoint (region-specific)',
    where: 'https://api.us.nylas.com or https://api.eu.nylas.com',
  },
  {
    key: 'NYLAS_CLIENT_ID',
    description: 'Your Nylas application client ID',
    where: 'Nylas Dashboard → Application Settings',
  },
  {
    key: 'NYLAS_CLIENT_SECRET',
    description: 'Your Nylas client secret (for token exchange)',
    where: 'Nylas Dashboard → Application Settings',
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    description: 'Your application URL (for OAuth callbacks)',
    where: 'http://localhost:3000 (dev) or https://yourdomain.com (prod)',
  },
];

requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar.key];
  
  if (!value) {
    checks.push({
      name: envVar.key,
      status: 'fail',
      message: `❌ Missing: ${envVar.description}`,
      fix: `Add to .env.local: ${envVar.key}=<value from ${envVar.where}>`,
    });
  } else if (value.includes('YOUR_') || value.includes('xxx')) {
    checks.push({
      name: envVar.key,
      status: 'warn',
      message: `⚠️  Placeholder detected: ${envVar.key}`,
      fix: `Replace with actual value from ${envVar.where}`,
    });
  } else {
    // Validate format
    if (envVar.key === 'NYLAS_API_KEY' && !value.startsWith('nylas_')) {
      checks.push({
        name: envVar.key,
        status: 'warn',
        message: `⚠️  ${envVar.key} should start with "nylas_"`,
        fix: 'Verify this is the correct API key from Nylas Dashboard',
      });
    } else if (envVar.key === 'NYLAS_API_URI' && !value.startsWith('https://api.')) {
      checks.push({
        name: envVar.key,
        status: 'warn',
        message: `⚠️  ${envVar.key} should start with "https://api."`,
        fix: 'Should be https://api.us.nylas.com or https://api.eu.nylas.com',
      });
    } else {
      checks.push({
        name: envVar.key,
        status: 'pass',
        message: `✅ ${envVar.key} is set`,
      });
    }
  }
});

// ============================================================================
// STEP 2: Check Azure App Registration (for Microsoft)
// ============================================================================

console.log('\n📋 Step 2: Azure App Registration Checklist...\n');

console.log('Please verify manually in Azure Portal:');
console.log('👉 https://portal.azure.com → App registrations → Your App\n');

const azureChecklist = [
  {
    step: 'Redirect URIs',
    items: [
      `${process.env.NYLAS_API_URI || 'https://api.us.nylas.com'}/v3/connect/callback`,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/nylas/callback`,
    ],
  },
  {
    step: 'API Permissions (Delegated)',
    items: [
      'Mail.ReadWrite',
      'Mail.Send',
      'Calendars.ReadWrite',
      'Contacts.ReadWrite',
      'offline_access',
      'User.Read',
    ],
  },
  {
    step: 'Admin Consent',
    items: ['✓ Grant admin consent for organization (if work account)'],
  },
  {
    step: 'Client Secret',
    items: [
      '✓ Valid and not expired',
      '✓ Copy the VALUE (not Secret ID)',
    ],
  },
];

azureChecklist.forEach((check, idx) => {
  console.log(`${idx + 1}. ${check.step}:`);
  check.items.forEach((item) => {
    console.log(`   ${item}`);
  });
  console.log();
});

// ============================================================================
// STEP 3: Check Nylas Dashboard Configuration
// ============================================================================

console.log('\n📋 Step 3: Nylas Dashboard Configuration...\n');

console.log('👉 Go to: https://dashboard.nylas.com\n');

console.log('Required Configuration:');
console.log('1. Applications → Your App → Callback URI:');
console.log(`   ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/nylas/callback\n`);

console.log('2. Integrations → Microsoft → Configure:');
console.log('   ⚠️  THIS IS CRITICAL - Last time this was empty!\n');
console.log('   Required fields:');
console.log('   - Client ID: <Your Azure App Client ID>');
console.log('   - Client Secret: <Your Azure App Client Secret>');
console.log('   - Tenant ID: "common" (or specific tenant)');
console.log('   - Scopes: Mail.ReadWrite, Mail.Send, offline_access, User.Read\n');

console.log('3. Test Connection:');
console.log('   After configuring Microsoft provider, click "Test Connection"');
console.log('   This will verify your Azure app credentials work.\n');

// ============================================================================
// STEP 4: Generate Configuration File
// ============================================================================

console.log('\n📋 Step 4: Generating Configuration Summary...\n');

const configSummary = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  checks: checks,
  azure: {
    redirectUris: [
      `${process.env.NYLAS_API_URI || 'https://api.us.nylas.com'}/v3/connect/callback`,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/nylas/callback`,
    ],
    permissions: [
      'Mail.ReadWrite',
      'Mail.Send',
      'Calendars.ReadWrite',
      'Contacts.ReadWrite',
      'offline_access',
      'User.Read',
    ],
  },
  nylas: {
    dashboardUrl: 'https://dashboard.nylas.com',
    callbackUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/nylas/callback`,
    apiUri: process.env.NYLAS_API_URI || 'NOT SET',
  },
};

// Save to file
const outputPath = path.join(process.cwd(), 'nylas-setup-report.json');
fs.writeFileSync(outputPath, JSON.stringify(configSummary, null, 2));

console.log(`✅ Configuration summary saved to: ${outputPath}\n`);

// ============================================================================
// STEP 5: Summary & Next Steps
// ============================================================================

console.log('=' .repeat(60));
console.log('\n📊 VALIDATION SUMMARY\n');

const passedChecks = checks.filter((c) => c.status === 'pass').length;
const failedChecks = checks.filter((c) => c.status === 'fail').length;
const warnChecks = checks.filter((c) => c.status === 'warn').length;

console.log(`✅ Passed: ${passedChecks}`);
console.log(`⚠️  Warnings: ${warnChecks}`);
console.log(`❌ Failed: ${failedChecks}\n`);

// Show all checks
checks.forEach((check) => {
  console.log(check.message);
  if (check.fix) {
    console.log(`   💡 Fix: ${check.fix}`);
  }
});

console.log('\n' + '='.repeat(60));

// ============================================================================
// STEP 6: Exit Status & Next Steps
// ============================================================================

if (failedChecks > 0) {
  console.log('\n❌ SETUP INCOMPLETE\n');
  console.log('Please fix the failed checks above before proceeding.\n');
  console.log('Next steps:');
  console.log('1. Add missing environment variables to .env.local');
  console.log('2. Restart your dev server');
  console.log('3. Run this script again: npm run setup:nylas\n');
  process.exit(1);
} else if (warnChecks > 0) {
  console.log('\n⚠️  SETUP READY (with warnings)\n');
  console.log('Environment variables are set, but please verify:\n');
  console.log('1. Azure App Registration is configured (see checklist above)');
  console.log('2. Nylas Dashboard Microsoft provider is configured');
  console.log('3. Run test connection in Nylas Dashboard\n');
  console.log('If all manual steps are complete, you can proceed!\n');
  process.exit(0);
} else {
  console.log('\n✅ SETUP COMPLETE!\n');
  console.log('All environment variables are set correctly.\n');
  console.log('Next steps:');
  console.log('1. Verify Azure App Registration (see checklist above)');
  console.log('2. Configure Microsoft provider in Nylas Dashboard');
  console.log('3. Test OAuth flow: npm run dev → Add Account\n');
  process.exit(0);
}

