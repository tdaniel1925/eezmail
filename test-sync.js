#!/usr/bin/env node

/**
 * Integration Tests for Email Sync System
 * Run with: node test-sync.js
 */

const assert = require('assert');

console.log('🧪 Email Sync Integration Tests\n');

// Test 1: Check environment variables
console.log('Test 1: Environment Variables');
try {
  assert(process.env.MICROSOFT_CLIENT_ID, 'MICROSOFT_CLIENT_ID not set');
  assert(process.env.MICROSOFT_CLIENT_SECRET, 'MICROSOFT_CLIENT_SECRET not set');
  assert(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID not set');
  assert(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET not set');
  assert(process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL not set');
  console.log('✅ All required environment variables set\n');
} catch (error) {
  console.error(`❌ ${error.message}\n`);
  process.exit(1);
}

// Test 2: Check Inngest is running
console.log('Test 2: Inngest Availability');
fetch('http://localhost:8288')
  .then((res) => {
    if (res.ok) {
      console.log('✅ Inngest is running at http://localhost:8288\n');
    } else {
      throw new Error('Inngest not responding');
    }
  })
  .catch((error) => {
    console.error(`❌ Inngest check failed: ${error.message}`);
    console.error('   Start Inngest with: npx inngest-cli@latest dev\n');
    process.exit(1);
  })
  .then(() => {
    // Test 3: Check sync orchestrator file exists
    console.log('Test 3: Sync Orchestrator');
    const fs = require('fs');
    const path = require('path');

    const files = [
      'src/lib/sync/sync-orchestrator.ts',
      'src/lib/sync/providers/base.ts',
      'src/lib/sync/providers/microsoft.ts',
      'src/lib/sync/providers/gmail.ts',
      'src/lib/sync/providers/imap.ts',
      'src/inngest/functions/sync-orchestrator.ts',
      'src/app/api/sync/health/route.ts',
    ];

    let allExist = true;
    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.error(`   ❌ ${file} - NOT FOUND`);
        allExist = false;
      }
    }

    if (allExist) {
      console.log('\n✅ All sync system files present\n');
    } else {
      console.error('\n❌ Some files are missing\n');
      process.exit(1);
    }

    // Test 4: Check health endpoint
    console.log('Test 4: Health Check Endpoint');
    return fetch('http://localhost:3000/api/sync/health');
  })
  .then((res) => res.json())
  .then((data) => {
    console.log('   Response:', JSON.stringify(data, null, 2));
    if (data.healthy) {
      console.log('✅ Health check endpoint working\n');
    } else {
      throw new Error('Health check returned unhealthy');
    }
  })
  .catch((error) => {
    console.error(`❌ Health check failed: ${error.message}`);
    console.error('   Make sure dev server is running: npm run dev\n');
    process.exit(1);
  })
  .then(() => {
    console.log('🎉 All integration tests passed!\n');
    console.log('Next steps:');
    console.log('1. Run the database cleanup SQL in Supabase');
    console.log('2. Follow MANUAL_TESTING_CHECKLIST.md');
    console.log('3. Test all 3 providers (Microsoft, Gmail, IMAP)');
    console.log('4. Deploy to Vercel');
    process.exit(0);
  });

