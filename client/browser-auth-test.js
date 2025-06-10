console.log("🧪 Testing Authentication Flow in Browser");

// Test the login flow
async function testAuthFlow() {
  try {
    console.log("1️⃣ Testing login...");

    // Clear any existing token
    localStorage.removeItem("token");

    // Import the auth service
    const { authService } = await import("./src/services/authService.js");

    // Test login
    const loginResponse = await authService.login({
      email: "test3@example.com",
      password: "Password123!",
    });

    console.log("✅ Login response:", loginResponse);
    console.log(
      "🔑 Token in localStorage:",
      localStorage.getItem("token") ? "Present" : "Missing"
    );

    // Test getCurrentUser
    console.log("\n2️⃣ Testing getCurrentUser...");
    const userResponse = await authService.getCurrentUser();
    console.log("✅ Current user response:", userResponse);

    // Test AI service
    console.log("\n3️⃣ Testing AI service...");
    const { aiService } = await import("./src/services/aiService.js");
    const aiResponse = await aiService.chatWithAI(
      "Test message for authentication"
    );
    console.log("✅ AI response:", aiResponse);

    console.log("\n🎉 All authentication tests passed!");
  } catch (error) {
    console.error("❌ Authentication test failed:", error);
  }
}

// Run the test
testAuthFlow();
