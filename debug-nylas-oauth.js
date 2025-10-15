#!/usr/bin/env node

/**
 * Debug Nylas OAuth Configuration
 * Check what credentials Nylas is actually using
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Nylas OAuth Debug\n');
console.log('='.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(
  'NYLAS_API_KEY:',
  process.env.NYLAS_API_KEY ? '✅ Found' : '❌ Missing'
);
console.log(
  'NYLAS_CLIENT_ID:',
  process.env.NYLAS_CLIENT_ID ? '✅ Found' : '❌ Missing'
);
console.log(
  'NYLAS_CLIENT_SECRET:',
  process.env.NYLAS_CLIENT_SECRET ? '✅ Found' : '❌ Missing'
);
console.log(
  'NEXT_PUBLIC_NYLAS_CLIENT_ID:',
  process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID ? '✅ Found' : '❌ Missing'
);

// Check if they match
console.log('\n🔍 Client ID Comparison:');
console.log('NYLAS_CLIENT_ID:', process.env.NYLAS_CLIENT_ID);
console.log(
  'NEXT_PUBLIC_NYLAS_CLIENT_ID:',
  process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID
);
console.log(
  'Match:',
  process.env.NYLAS_CLIENT_ID === process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID
    ? '✅ Yes'
    : '❌ No - This could be the issue!'
);

// Test Nylas API connection
console.log('\n🌐 Testing Nylas API Connection:');

const https = require('https');

const testNylasConnection = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.us.nylas.com',
      port: 443,
      path: '/v3/connectors',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.NYLAS_API_KEY}`,
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
          try {
            const connectors = JSON.parse(data);
            resolve(connectors);
          } catch (e) {
            reject({ status: res.statusCode, body: data });
          }
        } else {
          reject({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

const testMicrosoftConnector = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.us.nylas.com',
      port: 443,
      path: '/v3/connectors/microsoft',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.NYLAS_API_KEY}`,
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
          try {
            const connector = JSON.parse(data);
            resolve(connector);
          } catch (e) {
            reject({ status: res.statusCode, body: data });
          }
        } else {
          reject({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

(async () => {
  try {
    console.log('Testing Nylas API...');
    const connectors = await testNylasConnection();
    console.log('✅ Nylas API connected successfully');

    console.log('\n🔌 Microsoft Connector Details:');
    try {
      const microsoftConnector = await testMicrosoftConnector();
      console.log('✅ Microsoft connector found');
      console.log(
        'Settings:',
        JSON.stringify(microsoftConnector.settings || {}, null, 2)
      );

      // Check if the settings match what we expect
      if (microsoftConnector.settings) {
        console.log('\n🔍 Microsoft Connector Analysis:');
        console.log(
          'Client ID in Nylas:',
          microsoftConnector.settings.client_id
        );
        console.log('Tenant in Nylas:', microsoftConnector.settings.tenant);
        console.log(
          'Has Client Secret:',
          microsoftConnector.settings.client_secret ? '✅ Yes' : '❌ No'
        );

        // Check if the client ID matches
        const expectedClientId = process.env.NYLAS_CLIENT_ID;
        const actualClientId = microsoftConnector.settings.client_id;
        console.log(
          'Client ID Match:',
          expectedClientId === actualClientId ? '✅ Yes' : '❌ No'
        );

        if (expectedClientId !== actualClientId) {
          console.log('\n⚠️  MISMATCH DETECTED!');
          console.log('Expected Client ID:', expectedClientId);
          console.log('Actual Client ID in Nylas:', actualClientId);
          console.log('\n📝 ACTION REQUIRED:');
          console.log('1. Go to https://dashboard.nylas.com');
          console.log('2. Applications → Your App → Connectors → Microsoft');
          console.log('3. Update Client ID to:', expectedClientId);
          console.log(
            '4. Update Client Secret with the VALUE from your Azure app'
          );
          console.log('5. Save');
        }
      }
    } catch (error) {
      console.log('❌ Could not fetch Microsoft connector details');
      console.log('Error:', error.status || error.message);
    }
  } catch (error) {
    console.log('❌ Nylas API connection failed');
    console.log('Error:', error.status || error.message);
    console.log('Response:', error.body || 'No response body');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Debug Complete!\n');

  console.log('📋 Next Steps:');
  console.log("1. If Client IDs don't match, update Nylas Dashboard");
  console.log('2. If Client Secret is missing, add it to Nylas Dashboard');
  console.log('3. Verify Azure app has correct redirect URIs');
  console.log('4. Test connection again\n');
})();
