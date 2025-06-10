#!/usr/bin/env node

/**
 * Test Domain Purchase Fix
 * Tests the fixed domain parsing and pricing for domain purchases
 */

import axios from "axios";
import dotenv from "dotenv";

// Load environment
dotenv.config({ path: "./server/.env" });

const API_BASE = "https://regular-innocent-pony.ngrok-free.app/api";

// Test token from the API tests
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDc0NTU4YTUzNzExNjBmNDhiNzhhNiIsImlhdCI6MTc0OTUwMTMzOCwiZXhwIjoxNzUwMTA2MTM4fQ.oltwyLpbu6ycQHtwcw6NUvVzRADmrjSKjMLdMGDP_TI";

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

async function testDomainPurchase() {
  console.log("🧪 Testing Domain Purchase Fix...\n");

  // Test different domain types
  const testDomains = [
    "testfix.com",
    "mysite.co.uk",
    "example.io",
    "startup.ai",
  ];

  for (const domain of testDomains) {
    console.log(`🔍 Testing domain: ${domain}`);

    try {
      // First check availability
      console.log("  ✅ Checking availability...");
      const availabilityResponse = await axios.get(
        `${API_BASE}/domains/check/${domain}`,
        { headers }
      );

      const availability = availabilityResponse.data.data;
      console.log(
        `  📊 Available: ${availability.available}, Price: $${availability.price}`
      );

      if (availability.available && availability.price > 0) {
        // Try to purchase
        console.log("  💳 Attempting purchase...");
        const purchaseData = {
          domain: domain,
          years: 1,
          contactInfo: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            phone: "+1.1234567890",
            address: "123 Test St",
            city: "Test City",
            country: "US",
          },
        };

        const purchaseResponse = await axios.post(
          `${API_BASE}/domains/purchase`,
          purchaseData,
          { headers }
        );

        const result = purchaseResponse.data;
        if (result.success) {
          console.log(`  ✅ Purchase initiated successfully!`);
          console.log(`  📋 Transaction ID: ${result.data.transaction._id}`);
          console.log(`  💰 Amount: $${result.data.transaction.amount.value}`);
          console.log(`  🌐 Domain: ${result.data.domain.fullDomain}`);
          console.log(`  📝 Status: ${result.data.domain.status}`);
        } else {
          console.log(`  ❌ Purchase failed: ${result.message}`);
        }
      } else {
        console.log(`  ⏭️ Skipping purchase (not available or no price)`);
      }
    } catch (error) {
      console.log(
        `  ❌ Error testing ${domain}:`,
        error.response?.data?.message || error.message
      );
    }

    console.log(""); // Add spacing
  }
}

async function testDomainParsing() {
  console.log("🔧 Testing Domain Parsing Logic...\n");

  const testCases = [
    "example.com",
    "test.co.uk",
    "site.com.au",
    "mydomain.io",
    "startup.ai",
  ];

  testCases.forEach((domain) => {
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    const extension = domainParts.slice(1).join(".");

    console.log(`Domain: ${domain}`);
    console.log(`  Name: "${domainName}"`);
    console.log(`  Extension: "${extension}"`);
    console.log("");
  });
}

async function main() {
  console.log("🚀 Domain Purchase Fix Test\n");

  try {
    // Test parsing logic
    await testDomainParsing();

    // Test actual purchase API
    await testDomainPurchase();

    console.log("✅ All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

main();
