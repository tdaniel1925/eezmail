/**
 * Quick Performance Check for Production
 * Run: node scripts/check-live-performance.js
 */

const https = require('https');

const SITE_URL = 'https://easemail.app';
const ENDPOINTS = ['/', '/pricing', '/api/health'];

const THRESHOLDS = {
  '/': 1000, // Landing page should load in <1s
  '/pricing': 1000,
  '/api/health': 200, // API should respond in <200ms
};

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    https
      .get(`${SITE_URL}${path}`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const threshold = THRESHOLDS[path] || 1000;
          const status = responseTime <= threshold ? '✅' : '❌';

          resolve({
            path,
            status: res.statusCode,
            responseTime,
            threshold,
            passed: responseTime <= threshold,
            icon: status,
          });
        });
      })
      .on('error', (err) => {
        resolve({
          path,
          status: 'ERROR',
          responseTime: 0,
          threshold: THRESHOLDS[path] || 1000,
          passed: false,
          icon: '❌',
          error: err.message,
        });
      });
  });
}

async function runPerformanceCheck() {
  console.log('🚀 Checking live site performance...\n');
  console.log(`Site: ${SITE_URL}\n`);
  console.log('─'.repeat(70));
  console.log(
    'Endpoint'.padEnd(30) + 'Status'.padEnd(10) + 'Time'.padEnd(15) + 'Result'
  );
  console.log('─'.repeat(70));

  const results = [];

  for (const path of ENDPOINTS) {
    const result = await checkEndpoint(path);
    results.push(result);

    const pathDisplay = path.padEnd(30);
    const statusDisplay = String(result.status).padEnd(10);
    const timeDisplay =
      `${result.responseTime}ms / ${result.threshold}ms`.padEnd(15);

    console.log(`${pathDisplay}${statusDisplay}${timeDisplay}${result.icon}`);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log('─'.repeat(70));

  const allPassed = results.every((r) => r.passed);
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );

  console.log(`\n📊 Summary:`);
  console.log(`  Total endpoints: ${results.length}`);
  console.log(`  Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`  Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`  Average response time: ${avgResponseTime}ms`);

  if (allPassed) {
    console.log(`\n✅ All performance checks PASSED! Your site is FAST! 🚀`);
  } else {
    console.log(`\n❌ Some checks FAILED. Review the results above.`);
    console.log(`\n💡 Tips:`);
    console.log(`  - Check Vercel dashboard for errors`);
    console.log(`  - Review recent deployments`);
    console.log(`  - Check database performance`);
  }

  console.log(`\n🔗 Monitor: https://vercel.com/dashboard`);
  console.log(`📈 Analytics: https://vercel.com/dashboard/analytics\n`);
}

// Run the check
runPerformanceCheck().catch(console.error);
