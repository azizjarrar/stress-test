const express = require("express");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const app = express();
const PORT = 3000;
const TOTAL_REQUESTS = 200; // i have decreased this from 2000 to 200 for testing
const API_KEYS = ["API_KEY_1", "API_KEY_2", "API_KEY_3"];
const RATE_LIMIT = 1000; 

const fs = require('fs');
const path = require('path');
const LOG_FILE_PATH = path.join(__dirname, 'charge-test-results.log'); 



  // remove old file if it exists
  if (fs.existsSync(LOG_FILE_PATH)) {
    fs.unlinkSync(LOG_FILE_PATH);
    console.log('old log file removed');
  }




// Simulated third-party API mock
async function mockThirdPartyAPI(key) {
    return new Promise((resolve) => {
      const delay = Math.floor(Math.random() * 500);
      setTimeout(() => {
        logMessage = (`Mock API called with key: ${key}, delay: ${delay}ms \n`);
        console.warn(logMessage);
        fs.appendFileSync(LOG_FILE_PATH, logMessage);
        resolve("success");
      }, delay);
    });
  }

// rate limiters per API key
const rateLimiters = API_KEYS.map(
  () => new RateLimiterMemory({ points: RATE_LIMIT, duration: 20 })
);
// queue mechanism to pick an API key that is available
const lastLogTime = Array(rateLimiters.length).fill(0); // track per-key log times

async function getAvailableKey() {
  while (true) {
    const now = Date.now();

    for (let i = 0; i < rateLimiters.length; i++) {
      try {
        await rateLimiters[i].consume(1);
        return i;
      } catch (err) {
        const timeSinceLastLog = now - lastLogTime[i];

        if (timeSinceLastLog > 5000) { // 5 seconds
          logMessage = (`API key ${API_KEYS[i]} exhausted. Retry in ${Math.ceil(err.msBeforeNext)}ms \n`);
          console.warn(logMessage);
          fs.appendFileSync(LOG_FILE_PATH, logMessage);
          
          lastLogTime[i] = now;
        }
      }
    }
    // if All keys exhausted wait before retrying
    await new Promise((r) => setTimeout(r, 100));
  }
}

// Handler per incoming request
async function handleClientRequest() {
  const promises = Array.from({ length: TOTAL_REQUESTS }).map(async (_, idx) => {
    try {
      const keyIndex = await getAvailableKey();
      const key = API_KEYS[keyIndex];
      return await mockThirdPartyAPI(key);
    } catch (err) {
      console.error(`Error on internal request #${idx + 1}:`, err);
      return "failed";
    }
  });
  return Promise.all(promises);
}

app.get("/process", async (req, res) => {
  const start = Date.now();
  try {
    const results = await handleClientRequest();
    const end = Date.now();
    logMessage = (`Request completed in ${end - start}ms \n`);
    console.warn(logMessage);
    fs.appendFileSync(LOG_FILE_PATH, logMessage);
    res.json(results);
  } catch (err) {
    console.error("Fatal error during processing:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));