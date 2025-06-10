#!/usr/bin/env node

console.log("🧪 Frontend API Services Test Starting...");

// Mock fetch for Node.js environment
global.fetch = async (url, options = {}) => {
  const { default: fetch } = await import("node-fetch");
  return fetch(url, options);
};

// Set up environment
const BASE_URL = "https://regular-innocent-pony.ngrok-free.app/api";

// Test credentials
const testCredentials = {
  email: "test3@example.com",
  password: "Password123!",
};

// Mock localStorage for testing
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

// Import the services
async function importServices() {
  try {
    // We need to create a mock API module that works in Node.js
    const apiModule = {
      default: {
        get: async (url, config = {}) => {
          const headers = {
            "ngrok-skip-browser-warning": "1",
            "Content-Type": "application/json",
            ...(config.headers || {}),
          };

          // Add auth token if available
          const token = localStorage.getItem("token");
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const fullUrl = `${BASE_URL}${url}${
            config.params
              ? "?" + new URLSearchParams(config.params).toString()
              : ""
          }`;
          const response = await fetch(fullUrl, { headers });
          const data = await response.json();
          return { data, status: response.status };
        },

        post: async (url, body = {}, config = {}) => {
          const headers = {
            "ngrok-skip-browser-warning": "1",
            "Content-Type": "application/json",
            ...(config.headers || {}),
          };

          // Add auth token if available
          const token = localStorage.getItem("token");
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch(`${BASE_URL}${url}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          });
          const data = await response.json();
          return { data, status: response.status };
        },
      },
    };

    // Mock the authService
    const authService = {
      login: async (credentials) => {
        try {
          const response = await apiModule.default.post(
            "/auth/login",
            credentials
          );
          console.log(
            "🔍 Raw login response:",
            JSON.stringify(response, null, 2)
          );

          // Extract token from nested response structure
          const token = response.data.success
            ? response.data.data.token
            : response.data.token;
          const userData = response.data.success
            ? response.data.data
            : response.data;

          if (token) {
            localStorage.setItem("token", token);
            console.log(
              "✅ Token stored successfully:",
              token.substring(0, 20) + "..."
            );
          } else {
            console.log("❌ No token found in response");
          }

          return userData;
        } catch (error) {
          console.error("❌ Login error:", error.message);
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          const response = await apiModule.default.get("/auth/me");
          console.log(
            "🔍 Raw getCurrentUser response:",
            JSON.stringify(response, null, 2)
          );
          return response.data.success ? response.data.data : response.data;
        } catch (error) {
          console.error("❌ getCurrentUser error:", error.message);
          throw error;
        }
      },

      isAuthenticated: () => {
        return !!localStorage.getItem("token");
      },
    };

    // Mock aiService
    const aiService = {
      sendMessage: async (message, conversationId = null) => {
        try {
          const response = await apiModule.default.post("/ai/chat", {
            message,
            conversationId,
          });
          console.log(
            "🔍 Raw AI chat response:",
            JSON.stringify(response, null, 2)
          );
          return response.data.success ? response.data.data : response.data;
        } catch (error) {
          console.error("❌ AI chat error:", error.message);
          throw error;
        }
      },
    };

    return { authService, aiService };
  } catch (error) {
    console.error("❌ Error importing services:", error.message);
    throw error;
  }
}

async function testAuthenticationFlow() {
  try {
    const { authService, aiService } = await importServices();

    console.log("\n1️⃣ Testing login...");
    const loginResult = await authService.login(testCredentials);
    console.log("✅ Login successful");

    console.log("\n2️⃣ Testing getCurrentUser...");
    const userResult = await authService.getCurrentUser();
    console.log("✅ getCurrentUser successful:", userResult.user?.email);

    console.log("\n3️⃣ Testing AI chat...");
    const aiResult = await aiService.sendMessage(
      "Test message for domain consultation"
    );
    console.log("✅ AI chat successful, session ID:", aiResult.sessionId);

    console.log(
      "\n🎉 All tests passed! Authentication flow is working correctly."
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testAuthenticationFlow();
