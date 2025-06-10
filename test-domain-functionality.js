#!/usr/bin/env node

console.log("🔧 Testing Domain Search & AI Suggestions");
console.log("=".repeat(50));

const NGROK_URL = "https://regular-innocent-pony.ngrok-free.app/api";

// Mock fetch
global.fetch = async (url, options = {}) => {
  try {
    const { default: fetch } = await import("node-fetch");
    return await fetch(url, options);
  } catch (error) {
    console.error("❌ Fetch import failed:", error.message);
    throw error;
  }
};

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => {
    mockStorage[key] = value;
  },
  removeItem: (key) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  },
};

// Mock API
const mockApi = {
  async get(url, config = {}) {
    const headers = {
      "ngrok-skip-browser-warning": "1",
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const fullUrl = `${NGROK_URL}${url}${
      config.params ? "?" + new URLSearchParams(config.params).toString() : ""
    }`;
    const response = await fetch(fullUrl, { headers });
    const data = await response.json();
    return { data, status: response.status };
  },

  async post(url, body = {}, config = {}) {
    const headers = {
      "ngrok-skip-browser-warning": "1",
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${NGROK_URL}${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return { data, status: response.status };
  },
};

// First authenticate
async function authenticate() {
  console.log("🔐 Authenticating...");
  const response = await mockApi.post("/auth/login", {
    email: "test3@example.com",
    password: "Password123!",
  });

  if (response.data.success && response.data.data.token) {
    localStorage.setItem("token", response.data.data.token);
    console.log("✅ Authentication successful");
    return true;
  } else {
    console.error("❌ Authentication failed");
    return false;
  }
}

// Test domain search
async function testDomainSearch() {
  console.log("\n🔍 Testing Domain Search...");

  const domainService = {
    searchDomains: async (q, extensions = []) => {
      const params = { q };
      if (extensions.length > 0) params.extensions = extensions;

      const response = await mockApi.get("/domains/search", { params });
      console.log(
        "🔍 Raw domain search response:",
        JSON.stringify(response.data, null, 2)
      );

      return response.data.success ? response.data.data : response.data;
    },
  };

  try {
    const results = await domainService.searchDomains("testcompany", [
      "com",
      "net",
    ]);
    console.log("✅ Domain search successful");
    console.log("📊 Direct matches:", results.directMatches?.length || 0);
    console.log("🤖 AI suggestions:", results.aiSuggestions?.length || 0);

    // Test the frontend processing logic
    const allDomains = [];

    if (results.directMatches) {
      const directDomains = results.directMatches.map((match) => ({
        name: match.domain,
        available: match.available,
        price: match.price || 12.99,
        premium: false,
        registrar: "Namecheap",
        description: `Direct match for testcompany`,
      }));
      allDomains.push(...directDomains);
    }

    if (results.aiSuggestions) {
      const aiDomains = results.aiSuggestions.map((suggestion) => ({
        name: suggestion.domain,
        available: true,
        price: 12.99,
        premium: suggestion.brandabilityScore > 8,
        registrar: "Namecheap",
        description: suggestion.reasoning,
      }));
      allDomains.push(...aiDomains);
    }

    console.log("✅ Processed domains for frontend:", allDomains.length);
    return true;
  } catch (error) {
    console.error("❌ Domain search error:", error.message);
    return false;
  }
}

// Test AI suggestions
async function testAISuggestions() {
  console.log("\n🤖 Testing AI Suggestions...");

  const aiService = {
    getDomainSuggestions: async (businessDescription, preferences = {}) => {
      const response = await mockApi.post("/ai/suggest-domains", {
        business: businessDescription,
        industry: preferences.industry || "technology",
        keywords: preferences.keywords || [],
        budget: preferences.budget || 1000,
        extensions: preferences.extensions || [".com", ".net", ".org"],
        audience: preferences.audience || "general",
        context: preferences.context || businessDescription,
      });
      console.log(
        "🔍 Raw AI suggestions response:",
        JSON.stringify(response.data, null, 2)
      );

      return response.data.success ? response.data.data : response.data;
    },
  };

  try {
    const response = await aiService.getDomainSuggestions(
      "A technology startup focused on AI tools"
    );
    console.log("✅ AI suggestions successful");
    console.log("💡 Suggestions count:", response.suggestions?.length || 0);

    // Test the frontend processing logic
    const suggestions = response.suggestions || [];
    const formattedSuggestions = suggestions.map((suggestion, index) => ({
      name: suggestion.domain || suggestion.name || `suggestion-${index}.com`,
      available: true,
      price: suggestion.price || 12.99,
      premium: suggestion.brandabilityScore > 8,
      registrar: "Namecheap",
      description:
        suggestion.reasoning ||
        suggestion.description ||
        "AI generated domain suggestion",
    }));

    console.log(
      "✅ Processed AI suggestions for frontend:",
      formattedSuggestions.length
    );
    return true;
  } catch (error) {
    console.error("❌ AI suggestions error:", error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  try {
    const authOk = await authenticate();
    if (!authOk) {
      console.log("\n❌ Cannot continue without authentication");
      return;
    }

    const domainOk = await testDomainSearch();
    const aiOk = await testAISuggestions();

    console.log("\n" + "=".repeat(50));
    console.log("📋 Test Results:");
    console.log(`Domain Search: ${domainOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`AI Suggestions: ${aiOk ? "✅ PASS" : "❌ FAIL"}`);

    if (domainOk && aiOk) {
      console.log("\n🎉 All domain functionality should now work in frontend!");
    } else {
      console.log("\n⚠️ Some functionality failed. Check the errors above.");
    }
  } catch (error) {
    console.error("❌ Test runner error:", error.message);
  }
}

runTests();
