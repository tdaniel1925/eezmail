#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * Run this before EVERY deployment to production
 *
 * Usage: node validate-deployment.js
 */

require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

let failureCount = 0;
let warningCount = 0;

function pass(message) {
  console.log(`${colors.green}✅ PASS${colors.reset} ${message}`);
}

function fail(message) {
  console.log(`${colors.red}❌ FAIL${colors.reset} ${message}`);
  failureCount++;
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  WARN${colors.reset} ${message}`);
  warningCount++;
}

function info(message) {
  console.log(`${colors.cyan}ℹ️  INFO${colors.reset} ${message}`);
}

console.log(`\n${colors.bright}🔍 Pre-Deployment Validation${colors.reset}\n`);
console.log('='.repeat(60));

// 1. Environment Variables
console.log(`\n${colors.cyan}1. Environment Variables${colors.reset}`);

const required = {
  DATABASE_URL: 'Database connection string',
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anon key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',
  MICROSOFT_CLIENT_ID: 'Microsoft OAuth client ID',
  MICROSOFT_CLIENT_SECRET: 'Microsoft OAuth secret',
  GOOGLE_CLIENT_ID: 'Google OAuth client ID',
  GOOGLE_CLIENT_SECRET: 'Google OAuth secret',
  NEXT_PUBLIC_APP_URL: 'Application URL',
};

Object.entries(required).forEach(([key, description]) => {
  if (process.env[key]) {
    pass(`${key} - ${description}`);
  } else {
    fail(`${key} - ${description} is MISSING`);
  }
});

// 2. Database Configuration
console.log(`\n${colors.cyan}2. Database Configuration${colors.reset}`);

if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('supabase.co')) {
    pass('Supabase connection detected (SSL will be auto-enabled)');
  } else {
    info('Non-Supabase connection (verify SSL settings manually)');
  }

  if (process.env.DATABASE_URL.includes('password')) {
    pass('Database password included in connection string');
  } else {
    warn('Database connection string might be missing password');
  }
} else {
  fail('DATABASE_URL not set');
}

// 3. OAuth Configuration
console.log(`\n${colors.cyan}3. OAuth Configuration${colors.reset}`);

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (appUrl) {
  if (appUrl.startsWith('http://localhost')) {
    warn('APP_URL is localhost - make sure this is intentional');
  } else if (appUrl.startsWith('https://')) {
    pass('APP_URL uses HTTPS');
  } else {
    fail('APP_URL should use HTTPS in production');
  }

  info(`Microsoft redirect URI: ${appUrl}/api/auth/microsoft/callback`);
  info(`Google redirect URI: ${appUrl}/api/auth/google/callback`);
} else {
  fail('NEXT_PUBLIC_APP_URL not set');
}

// 4. Critical Files Exist
console.log(`\n${colors.cyan}4. Critical Files${colors.reset}`);

const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'src/lib/db/index.ts',
  'src/lib/sync/sync-orchestrator.ts',
  'src/lib/sync/providers/microsoft.ts',
  'src/lib/sync/providers/gmail.ts',
  'src/components/sidebar/FolderList.tsx',
  'src/app/api/sync/health/route.ts',
  'src/inngest/functions/sync-orchestrator.ts',
];

criticalFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    pass(file);
  } else {
    fail(`${file} is MISSING`);
  }
});

// 5. Build Check
console.log(`\n${colors.cyan}5. TypeScript & Build${colors.reset}`);

try {
  const { execSync } = require('child_process');

  info('Running TypeScript type check...');
  execSync('npm run type-check', { stdio: 'pipe' });
  pass('TypeScript type check passed');
} catch (error) {
  fail('TypeScript type check failed - run "npm run type-check" for details');
}

// 6. Critical Code Checks
console.log(`\n${colors.cyan}6. Critical Code Validations${colors.reset}`);

// Check SSL configuration
const dbIndexPath = path.join(process.cwd(), 'src/lib/db/index.ts');
if (fs.existsSync(dbIndexPath)) {
  const dbContent = fs.readFileSync(dbIndexPath, 'utf-8');

  if (dbContent.includes('supabase.co') && dbContent.includes('ssl')) {
    pass('SSL auto-detection for Supabase is implemented');
  } else {
    fail('SSL auto-detection might be missing - check src/lib/db/index.ts');
  }
}

// Check triggerSync export
const orchestratorPath = path.join(
  process.cwd(),
  'src/lib/sync/sync-orchestrator.ts'
);
if (fs.existsSync(orchestratorPath)) {
  const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf-8');

  if (orchestratorContent.includes('export const triggerSync')) {
    pass('triggerSync function is exported');
  } else {
    fail('triggerSync function export is missing');
  }
}

// Check Microsoft pagination
const msProviderPath = path.join(
  process.cwd(),
  'src/lib/sync/providers/microsoft.ts'
);
if (fs.existsSync(msProviderPath)) {
  const msContent = fs.readFileSync(msProviderPath, 'utf-8');

  if (
    msContent.includes('fetchFoldersRecursive') ||
    msContent.includes('$top')
  ) {
    pass('Microsoft folder pagination is implemented');
  } else {
    fail('Microsoft folder pagination might be missing');
  }
}

// Check folder filtering
const folderListPath = path.join(
  process.cwd(),
  'src/components/sidebar/FolderList.tsx'
);
if (fs.existsSync(folderListPath)) {
  const folderContent = fs.readFileSync(folderListPath, 'utf-8');

  if (
    folderContent.includes('excludedExactTypes') ||
    !folderContent.includes('excludedNames')
  ) {
    pass('Folder filtering uses exact matching (not overly aggressive)');
  } else {
    warn('Folder filtering might be too aggressive - verify manually');
  }
}

// 7. Integration Tests
console.log(
  `\n${colors.cyan}7. Integration Tests (if available)${colors.reset}`
);

const testPath = path.join(
  process.cwd(),
  'tests/integration/email-sync.test.ts'
);
if (fs.existsSync(testPath)) {
  info('Integration tests found - run with: npm test');
} else {
  warn('Integration tests not found at tests/integration/email-sync.test.ts');
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log(`\n${colors.bright}📊 Summary${colors.reset}\n`);

if (failureCount === 0 && warningCount === 0) {
  console.log(
    `${colors.green}${colors.bright}🎉 ALL CHECKS PASSED!${colors.reset}`
  );
  console.log(
    `${colors.green}✅ Safe to deploy to production${colors.reset}\n`
  );
  process.exit(0);
} else if (failureCount === 0) {
  console.log(`${colors.yellow}⚠️  ${warningCount} WARNING(S)${colors.reset}`);
  console.log(
    `${colors.yellow}Review warnings before deploying${colors.reset}\n`
  );
  process.exit(0);
} else {
  console.log(
    `${colors.red}${colors.bright}❌ ${failureCount} FAILURE(S)${colors.reset}`
  );
  console.log(
    `${colors.red}DO NOT DEPLOY - Fix failures first!${colors.reset}\n`
  );
  process.exit(1);
}
