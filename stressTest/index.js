const axios = require('axios');
const CONCURRENT_REQUESTS = 100;
const TARGET_URL = 'http://localhost:3000/process';
const fs = require('fs');
const path = require('path');
const LOG_FILE_PATH = path.join(__dirname, 'stress-test-results.log');

(async () => {

  // remove old file if it exists
  if (fs.existsSync(LOG_FILE_PATH)) {
    fs.unlinkSync(LOG_FILE_PATH);
    console.log('old log file removed');
  }

  const startGlobal = Date.now();

  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
    const start = Date.now();
    return axios.get(TARGET_URL)
      .then(res => {
        const duration = Date.now() - start;
        const logMessage = `Request #${i + 1} completed in ${duration}ms, result length: ${res.data.length}\n`;
        console.log(logMessage);
        fs.appendFileSync(LOG_FILE_PATH, logMessage);
        return duration;
      })
      .catch(err => {
        console.error(`Request #${i + 1} failed:`, err.message);
        return null;
      });
  });

  const results = await Promise.all(requests);
  const endGlobal = Date.now();

  const successful = results.filter(r => r !== null).length;
  const avgTime = results.reduce((a, b) => a + (b || 0), 0) / successful;

  console.log(`\nCompleted ${successful}/${CONCURRENT_REQUESTS} requests`);
  console.log(`Average time per request: ${Math.round(avgTime)}ms`);
  console.log(`Total time for all: ${Math.round(endGlobal - startGlobal)}ms`);

})();