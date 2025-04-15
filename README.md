# Scalable Backend Simulation with Rate-Limited API Keys

This project is a simulation of a scalable backend system using Node.js and Express. It handles high-concurrency incoming requests, each triggering multiple outbound calls to a simulated third-party API while respecting per-key rate limits.

---

## 🔧 Project Description

- Accepts concurrent HTTP requests via `/process` endpoint.  
- Each request triggers **200 simulated third-party calls** (reduced from 2000 for testing).  
- Uses a pool of **3 API keys**, each rate-limited to **1000 requests per 20 seconds**.  
- Implements **per-key rate limiting** using `rate-limiter-flexible`.  
- Randomized latency simulates real-world external API behavior.  
- Ensures fair key usage and avoids key overloading by queueing when all keys are exhausted.  

---

## ✅ Features

- Efficient concurrency with Promise-based request handling.  
- Time measurement for each request and full batch duration.  
- Clean separation between logic (API key queueing, mock API, rate limiting).  

---

## 🧪 Testing

- Stress test triggers **100 concurrent requests**, each internally dispatching **200 mock API calls**.  
- Logs will show:
  - Time taken per request  
  - Total duration  
  - API key usage and fallback handling  

> **Note:** API call count and concurrency are reduced for local testing. You can scale them back to original numbers (2000 per request) for final validation.
