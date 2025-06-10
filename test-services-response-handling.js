#!/usr/bin/env node

console.log("🔧 Frontend Services Response Handling Test");
console.log("=".repeat(50));

const NGROK_URL = "https://regular-innocent-pony.ngrok-free.app/api";

// Mock fetch for testing
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

// Mock axios-like API
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

// Test auth service
async function testAuthService() {
  console.log("\n📝 Testing Auth Service...");

  const authService = {
    login: async (credentials) => {
      const response = await mockApi.post("/auth/login", credentials);
      console.log(
        "🔍 Raw login response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.success && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token);
        console.log("✅ Token stored successfully");
      }
      return response.data;
    },

    getCurrentUser: async () => {
      const response = await mockApi.get("/auth/me");
      console.log(
        "🔍 Raw getCurrentUser response:",
        JSON.stringify(response.data, null, 2)
      );
      return response.data.success ? response.data.data : response.data;
    },
  };

  try {
    await authService.login({
      email: "test3@example.com",
      password: "Password123!",
    });
    const userResult = await authService.getCurrentUser();
    console.log("✅ Auth service working correctly");
    console.log("👤 User email:", userResult.user?.email);
    return true;
  } catch (error) {
    console.error("❌ Auth service error:", error.message);
    return false;
  }
}

// Test AI service
async function testAIService() {
  console.log("\n🤖 Testing AI Service...");

  const aiService = {
    chatWithAI: async (message, conversationId = null) => {
      const response = await mockApi.post("/ai/chat", {
        message,
        conversationId,
      });
      console.log(
        "🔍 Raw AI response:",
        JSON.stringify(response.data, null, 2)
      );

      const data = response.data.success ? response.data.data : response.data;
      console.log("🔍 Extracted AI data:", JSON.stringify(data, null, 2));
      return data;
    },
  };

  try {
    const result = await aiService.chatWithAI("Test AI consultation message");
    console.log("✅ AI service working correctly");
    console.log("💬 AI response message length:", result.message?.length || 0);
    console.log("🆔 Session ID:", result.sessionId);
    return true;
  } catch (error) {
    console.error("❌ AI service error:", error.message);
    return false;
  }
}

// Test domain service
async function testDomainService() {
  console.log("\n🌐 Testing Domain Service...");

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
    const result = await domainService.searchDomains("testdomain", [
      "com",
      "net",
    ]);
    console.log("✅ Domain service working correctly");
    console.log("🔍 Search query:", result.query);
    console.log("📊 AI suggestions count:", result.aiSuggestions?.length || 0);
    return true;
  } catch (error) {
    console.error("❌ Domain service error:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  try {
    const authOk = await testAuthService();
    const aiOk = await testAIService();
    const domainOk = await testDomainService();

    console.log("\n" + "=".repeat(50));
    console.log("📋 Test Results Summary:");
    console.log(`Auth Service: ${authOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`AI Service: ${aiOk ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Domain Service: ${domainOk ? "✅ PASS" : "❌ FAIL"}`);

    if (authOk && aiOk && domainOk) {
      console.log("\n🎉 All services are handling responses correctly!");
      console.log("✅ Frontend should now work properly with the backend API.");
    } else {
      console.log("\n⚠️ Some services failed. Check the errors above.");
    }
  } catch (error) {
    console.error("❌ Test runner error:", error.message);
    process.exit(1);
  }
}

runAllTests();
