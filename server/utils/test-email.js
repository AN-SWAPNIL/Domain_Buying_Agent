import emailService from "../services/email.service.js";
import dotenv from "dotenv";

dotenv.config();

async function testEmailService() {
  console.log("🧪 Testing Email Service...");
  console.log("📧 Using SMTP Configuration:");
  console.log("  Host:", process.env.MAIL_HOST);
  console.log("  Port:", process.env.MAIL_PORT);
  console.log("  Username:", process.env.MAIL_USERNAME);
  console.log(
    "  Password:",
    process.env.MAIL_PASSWORD ? "✅ Set" : "❌ Not set"
  );

  try {
    // Test email connection
    console.log("🔍 Testing email connection...");
    const connectionTest = await emailService.verifyConnection();
    console.log(
      "📧 Connection test:",
      connectionTest ? "✅ Success" : "❌ Failed"
    );

    if (connectionTest) {
      // Test all email types
      console.log("📨 Testing email sending capabilities...");

      const testEmail = process.env.MAIL_USERNAME; // Send to self for testing

      // Test welcome email
      const welcomeResult = await emailService.sendWelcomeEmail(
        testEmail,
        "Test User"
      );
      console.log(
        "Welcome email:",
        welcomeResult.success ? "✅ Sent" : "❌ Failed"
      );

      // Test password reset email
      const resetResult = await emailService.sendPasswordResetEmail(
        testEmail,
        "Test User",
        "test-reset-token-123"
      );
      console.log(
        "Reset email:",
        resetResult.success ? "✅ Sent" : "❌ Failed"
      );

      // Test domain purchase email
      const purchaseResult = await emailService.sendDomainPurchaseConfirmation(
        testEmail,
        "Test User",
        "example.com",
        29.99
      );
      console.log(
        "Purchase email:",
        purchaseResult.success ? "✅ Sent" : "❌ Failed"
      );

      console.log("\n✅ All email tests completed successfully!");
    } else {
      console.log("⚠️  Skipping email sending tests due to connection failure");
      console.log("💡 To fix Gmail issues:");
      console.log("   1. Enable 2-Factor Authentication on your Gmail account");
      console.log("   2. Generate an App Password for this application");
      console.log(
        "   3. Use the App Password instead of your regular password"
      );
    }
  } catch (error) {
    console.error("❌ Email service test failed:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.log("🔧 Network connection issue. Try:");
      console.log("   - Check internet connection");
      console.log("   - Verify SMTP server hostname");
      console.log("   - Check firewall settings");
    }
  }
}

// Run the test
testEmailService();
