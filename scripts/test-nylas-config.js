#!/usr/bin/env node

/**
 * Nylas Configuration Test Script
 * Tests Nylas API connectivity and Microsoft provider setup
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const NYLAS_API_KEY = process.env.NYLAS_API_KEY;
const NYLAS_CLIENT_ID = process.env.NYLAS_CLIENT_ID;
const NYLAS_API_URI = process.env.NYLAS_API_URI || 'https://api.us.nylas.com';

console.log('\n🔍 Nylas Configuration Test\n');
console.log('='.repeat(50));

// Test 1: Check environment variables
console.log('\n📋 Step 1: Environment Variables');
console.log('='.repeat(50));

if (!NYLAS_API_KEY) {
  console.log('❌ NYLAS_API_KEY is missing!');
  process.exit(1);
} else {
  console.log('✅ NYLAS_API_KEY: ' + NYLAS_API_KEY.substring(0, 20) + '...');
}

if (!NYLAS_CLIENT_ID) {
  console.log('❌ NYLAS_CLIENT_ID is missing!');
  process.exit(1);
} else {
  console.log('✅ NYLAS_CLIENT_ID: ' + NYLAS_CLIENT_ID);
}

console.log('✅ NYLAS_API_URI: ' + NYLAS_API_URI);

// Test 2: Test API connectivity
console.log('\n🌐 Step 2: API Connectivity');
console.log('='.repeat(50));

const testApiConnection = () => {
  return new Promise((resolve, reject) => {
    const url = new URL('/v3/applications', NYLAS_API_URI);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NYLAS_API_KEY}`,
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

const testProviderConfig = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(`/v3/connectors`, NYLAS_API_URI);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${NYLAS_API_KEY}`,
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

// Run tests
(async () => {
  try {
    // Test API connection
    console.log('Testing Nylas API connection...');
    const appData = await testApiConnection();
    console.log('✅ Successfully connected to Nylas API!');
    console.log('   Application ID:', NYLAS_CLIENT_ID);

    // Test provider configuration
    console.log('\n🔌 Step 3: Provider Configuration');
    console.log('='.repeat(50));
    console.log('Checking configured providers...');

    const connectors = await testProviderConfig();

    if (!connectors || !connectors.data || connectors.data.length === 0) {
      console.log('\n⚠️  WARNING: No connectors/providers configured!');
      console.log('\n📝 REQUIRED ACTION:');
      console.log('   1. Go to https://dashboard.nylas.com');
      console.log('   2. Navigate to Applications → Your App → Connectors');
      console.log('   3. Configure Microsoft provider with:');
      console.log('      - Provider: Microsoft/Office 365');
      console.log('      - Auth type: OAuth 2.0');
      console.log(
        '      - Scopes: Mail.ReadWrite, Mail.Send, Calendars.ReadWrite, etc.'
      );
      console.log('\n   OR configure IMAP:');
      console.log('      - Provider: IMAP');
      console.log('      - Host: outlook.office365.com');
      console.log('      - Port: 993 (SSL)');
    } else {
      console.log(
        `\n✅ Found ${connectors.data.length} configured connector(s):`
      );
      connectors.data.forEach((connector, index) => {
        console.log(
          `\n   ${index + 1}. ${connector.provider || connector.name}`
        );
        console.log(`      - Type: ${connector.provider}`);
        console.log(
          `      - Settings:`,
          JSON.stringify(connector.settings || {}, null, 6)
        );
      });

      // Check for Microsoft
      const hasMicrosoft = connectors.data.some(
        (c) =>
          c.provider?.toLowerCase().includes('microsoft') ||
          c.provider?.toLowerCase().includes('office365') ||
          c.name?.toLowerCase().includes('microsoft')
      );

      if (!hasMicrosoft) {
        console.log('\n❌ Microsoft provider NOT found!');
        console.log('\n📝 ACTION REQUIRED:');
        console.log(
          '   Go to Nylas Dashboard and add Microsoft/Office365 connector'
        );
      } else {
        console.log('\n✅ Microsoft provider is configured!');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test Complete!\n');

    // Final recommendations
    console.log('📋 Next Steps:');
    console.log(
      '   1. Verify Microsoft connector is configured in Nylas Dashboard'
    );
    console.log('   2. Ensure Azure App redirect URIs match Nylas callback');
    console.log(
      '   3. Check Azure App has all required Microsoft Graph permissions'
    );
    console.log('   4. Grant admin consent if using work/school account');
    console.log(
      '\n   See MICROSOFT_CONNECTION_TROUBLESHOOTING.md for details.\n'
    );
  } catch (error) {
    console.log('\n❌ Test Failed!');
    console.log('='.repeat(50));

    if (error.status) {
      console.log('HTTP Status:', error.status);
      console.log('Response:', error.body);

      if (error.status === 401) {
        console.log('\n⚠️  Authentication failed - check your NYLAS_API_KEY');
      } else if (error.status === 404) {
        console.log('\n⚠️  Application not found - check your NYLAS_CLIENT_ID');
      }
    } else {
      console.log('Error:', error.message || error);
    }

    console.log('\n📝 Troubleshooting:');
    console.log('   1. Verify NYLAS_API_KEY in .env.local');
    console.log('   2. Verify NYLAS_CLIENT_ID in .env.local');
    console.log('   3. Check network connectivity');
    console.log('   4. Visit https://dashboard.nylas.com to verify account\n');

    process.exit(1);
  }
})();
