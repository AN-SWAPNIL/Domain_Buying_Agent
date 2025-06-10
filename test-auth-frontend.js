// Quick Authentication Test Script
// Paste this in the browser console to test auth flow

console.log("🧪 Authentication Test Starting...");

// Test the working token from API tests
const testToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NDVlZWU3ZWFlYTk5MGVhMzE5NWIyMyIsImlhdCI6MTc0OTQxNDU2MiwiZXhwIjoxNzUwMDE5MzYyfQ.m2ntrXQfbf4zWD_qPvV3hvRaYtSMw8otJD0h_sSLH2A";

// Step 1: Set token in localStorage
localStorage.setItem("token", testToken);
console.log(
  "✅ Token set in localStorage:",
  testToken.substring(0, 20) + "..."
);

// Step 2: Test API call with axios
const API_URL = "https://regular-innocent-pony.ngrok-free.app/api";

// Create axios instance like the app does
const axios =
  window.axios || (await import("https://cdn.skypack.dev/axios")).default;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  },
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔑 Adding token to request:", config.url);
  }
  return config;
});

// Test auth endpoint
try {
  const response = await api.get("/auth/me");
  console.log("✅ Auth test successful:", response.data);

  // Test AI chat
  const chatResponse = await api.post("/ai/chat", {
    message: "Hello, this is a test",
    conversationId: null,
  });
  console.log("✅ AI chat test successful:", chatResponse.data);

  console.log("🎉 All tests passed! Authentication is working.");
  console.log("💡 Now refresh the page and the frontend should work.");
} catch (error) {
  console.error("❌ Test failed:", error);
  console.log("🔍 Error details:", {
    status: error.response?.status,
    message: error.response?.data?.message,
    data: error.response?.data,
  });
}
