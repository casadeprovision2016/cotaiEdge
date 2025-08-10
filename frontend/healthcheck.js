#!/usr/bin/env node

// CotAi Edge Frontend Health Check
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const healthCheck = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend health check passed');
        resolve(true);
      } else {
        console.log(`❌ Frontend health check failed: ${res.statusCode}`);
        reject(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ Frontend health check error: ${err.message}`);
      reject(false);
    });

    req.on('timeout', () => {
      console.log('❌ Frontend health check timeout');
      req.abort();
      reject(false);
    });

    req.setTimeout(5000);
    req.end();
  });
};

healthCheck()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));