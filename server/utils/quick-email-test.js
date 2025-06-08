import emailService from "../services/email.service.js";
import dotenv from "dotenv";

dotenv.config();

async function quickTest() {
  console.log("🚀 Quick Email Service Test");

  try {
    console.log("1. Testing connection...");
    const connected = await emailService.verifyConnection();
    console.log("   Connection:", connected ? "✅" : "❌");

    if (connected) {
      console.log("2. Testing welcome email...");
      const welcomeResult = await emailService.sendWelcomeEmail(
        process.env.MAIL_USERNAME,
        "Test User"
      );
      console.log("   Welcome email:", welcomeResult.success ? "✅" : "❌");

      console.log("3. Testing password reset email...");
      const resetResult = await emailService.sendPasswordResetEmail(
        process.env.MAIL_USERNAME,
        "Test User",
        "test-token-123"
      );
      console.log("   Reset email:", resetResult.success ? "✅" : "❌");

      console.log("4. Testing purchase confirmation email...");
      const purchaseResult = await emailService.sendDomainPurchaseConfirmation(
        process.env.MAIL_USERNAME,
        "Test User",
        "example.com",
        29.99
      );
      console.log("   Purchase email:", purchaseResult.success ? "✅" : "❌");
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

quickTest();
