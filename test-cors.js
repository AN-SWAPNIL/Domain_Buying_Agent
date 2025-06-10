// Simple test script to check CORS and authentication
// Open browser console and paste this code

console.log("🧪 Testing CORS and Authentication...");

const API_URL = "https://regular-innocent-pony.ngrok-free.app/api";

// Test 1: CORS Health Check
fetch(`${API_URL}/../health`, {
  method: "GET",
  headers: {
    "ngrok-skip-browser-warning": "1",
  },
})
  .then((response) => {
    console.log("✅ Health Check Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("✅ Health Check Response:", data);
  })
  .catch((error) => {
    console.error("❌ Health Check Error:", error);
  });

// Test 2: CORS Debug Endpoint
fetch(`${API_URL}/../debug/cors`, {
  method: "GET",
  headers: {
    "ngrok-skip-browser-warning": "1",
  },
})
  .then((response) => {
    console.log("✅ CORS Debug Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("✅ CORS Debug Response:", data);
  })
  .catch((error) => {
    console.error("❌ CORS Debug Error:", error);
  });

// Test 3: Auth Login
fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  },
  body: JSON.stringify({
    email: "test@example.com",
    password: "Password123!",
  }),
})
  .then((response) => {
    console.log("✅ Login Status:", response.status);
    return response.json();
  })
  .then((data) => {
    console.log("✅ Login Response:", data);
    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("✅ Token saved to localStorage");
    }
  })
  .catch((error) => {
    console.error("❌ Login Error:", error);
  });

console.log(
  "🔍 Run these tests in your browser console to check CORS and auth"
);
