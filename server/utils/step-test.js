import emailService from "../services/email.service.js";
import dotenv from "dotenv";

dotenv.config();

async function stepByStepTest() {
  console.log("🔄 Step-by-step Email Test");

  try {
    console.log("Step 1: Verify connection...");
    const isConnected = await Promise.race([
      emailService.verifyConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      ),
    ]);
    console.log("Connection result:", isConnected);

    if (isConnected) {
      console.log("Step 2: Send welcome email...");
      const welcomeResult = await Promise.race([
        emailService.sendWelcomeEmail(process.env.MAIL_USERNAME, "Test User"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Welcome email timeout")), 15000)
        ),
      ]);
      console.log("Welcome email result:", welcomeResult);
    }

    console.log("✅ Test completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test error:", error.message);
    process.exit(1);
  }
}

stepByStepTest();
