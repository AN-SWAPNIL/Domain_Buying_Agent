#!/usr/bin/env node

/**
 * Simple script to test authentication issues in the Domain Buying Agent
 * Run with: node debug-auth.js
 */

import https from "https";
import http from "http";

const API_BASE =
  process.env.API_URL || "https://regular-innocent-pony.ngrok-free.app/api";
const TEST_TOKEN =
  process.env.TEST_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDVlZWU3ZWFlYTk5MGVhMzE5NWIyMyIsImlhdCI6MTc0OTQxNDU2MiwiZXhwIjoxNzUwMDE5MzYyfQ.m2ntrXQfbf4zWD_qPvV3hvRaYtSMw8otJD0h_sSLH2A";

console.log("🔍 Debug Auth Script for Domain Buying Agent");
console.log("📍 API Base URL:", API_BASE);
console.log("🔑 Testing Token:", TEST_TOKEN ? "Present" : "Missing");
console.log("─".repeat(60));

async function makeRequest(endpoint, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${endpoint}`;
    const isHttps = url.startsWith("https");
    const requestModule = isHttps ? https : http;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "1",
        ...(TEST_TOKEN && { Authorization: `Bearer ${TEST_TOKEN}` }),
      },
    };

    const req = requestModule.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log("1️⃣ Testing Health Check...");
  try {
    const health = await makeRequest("/../health");
    console.log(
      `   Status: ${health.status} ${health.status === 200 ? "✅" : "❌"}`
    );
    console.log(`   Response:`, health.data);
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
  }

  console.log("\n2️⃣ Testing Auth Token Validation...");
  try {
    const auth = await makeRequest("/auth/me");
    console.log(
      `   Status: ${auth.status} ${auth.status === 200 ? "✅" : "❌"}`
    );
    if (auth.status === 200) {
      console.log(`   User: ${auth.data.user?.email || "Unknown"}`);
    } else {
      console.log(`   Error:`, auth.data);
    }
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
  }

  console.log("\n3️⃣ Testing AI Chat Endpoint...");
  try {
    const chat = await makeRequest("/ai/chat", "POST", {
      message: "Hello, this is a test message",
      conversationId: null,
    });
    console.log(
      `   Status: ${chat.status} ${chat.status === 200 ? "✅" : "❌"}`
    );
    if (chat.status === 200) {
      console.log(`   AI Response: ${chat.data.message?.substring(0, 100)}...`);
    } else {
      console.log(`   Error:`, chat.data);
    }
  } catch (error) {
    console.log(`   Error: ❌ ${error.message}`);
  }

  console.log("\n🔧 Troubleshooting Tips:");
  console.log(
    "   • If Health Check fails: Server is down or ngrok tunnel is inactive"
  );
  console.log("   • If Auth fails (401): Token is expired or invalid");
  console.log("   • If AI Chat fails (401): User needs to log in again");
  console.log("   • If other errors: Check server logs for details");

  console.log("\n💡 Quick Fixes:");
  console.log("   • Restart server: cd server && npm start");
  console.log("   • Check ngrok: Visit http://localhost:4040");
  console.log(
    "   • Login again: Visit https://regular-innocent-pony.ngrok-free.app"
  );
}

runTests().catch(console.error);
