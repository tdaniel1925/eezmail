#!/usr/bin/env node

/**
 * Automated GitHub Secrets Upload
 * Adds all secrets to GitHub in one go!
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

console.log('\n🔐 Automated GitHub Secrets Upload\n');

// First, you need to provide these Vercel values
const VERCEL_TOKEN = process.argv[2];
const VERCEL_PROJECT_ID = process.argv[3];

if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.log('❌ Missing Vercel information!\n');
  console.log(
    'Usage: node upload-secrets.js <VERCEL_TOKEN> <VERCEL_PROJECT_ID>\n'
  );
  console.log('Get these from:');
  console.log('1. Token: https://vercel.com/account/tokens');
  console.log(
    '2. Project ID: https://vercel.com/bot-makers/win-email_client/settings\n'
  );
  process.exit(1);
}

// All secrets to upload
const secrets = {
  // Vercel
  VERCEL_TOKEN: VERCEL_TOKEN,
  VERCEL_ORG_ID: 'bot-makers',
  VERCEL_PROJECT_ID: VERCEL_PROJECT_ID,

  // Database & Supabase
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // OAuth
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // App URL
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://win-emailclient-bot-makers.vercel.app',
};

// Validate all secrets are present
console.log('📋 Checking secrets from .env.local...\n');
let missingSecrets = [];

Object.entries(secrets).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key} - MISSING`);
    missingSecrets.push(key);
  } else {
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${key} - ${preview}`);
  }
});

if (missingSecrets.length > 0) {
  console.log(
    `\n❌ Missing ${missingSecrets.length} secret(s). Check your .env.local file.\n`
  );
  process.exit(1);
}

console.log('\n✅ All secrets present!\n');
console.log('🚀 Uploading to GitHub...\n');

// Upload each secret
let successCount = 0;
let failCount = 0;

Object.entries(secrets).forEach(([key, value]) => {
  try {
    // Use gh CLI to set secret - specify the repository
    execSync(
      `gh secret set ${key} --repo tdaniel1925/eezmail --body "${value}"`,
      {
        stdio: 'pipe',
        encoding: 'utf-8',
      }
    );
    console.log(`✅ ${key} uploaded`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${key} failed: ${error.message}`);
    failCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('🎉 All secrets uploaded successfully!\n');
  console.log('Next steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "Add GitHub Actions CI/CD"');
  console.log('3. git push origin main');
  console.log('4. Watch your automated deployment! 🚀\n');
} else {
  console.log('⚠️  Some secrets failed to upload.');
  console.log('You may need to add them manually at:');
  console.log(
    'https://github.com/your-username/win-email_client/settings/secrets/actions\n'
  );
}
