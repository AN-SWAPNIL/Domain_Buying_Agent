import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Environment Variables Check:");
console.log("MAIL_HOST:", process.env.MAIL_HOST);
console.log("MAIL_PORT:", process.env.MAIL_PORT);
console.log("MAIL_USERNAME:", process.env.MAIL_USERNAME);
console.log("MAIL_PASSWORD exists:", !!process.env.MAIL_PASSWORD);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Test nodemailer import
try {
  const nodemailer = await import("nodemailer");
  console.log("✅ Nodemailer imported successfully");
  console.log("Available methods:", Object.keys(nodemailer.default));
} catch (error) {
  console.error("❌ Nodemailer import failed:", error);
}

// Test email service import
try {
  console.log("📧 Testing email service import...");
  const emailService = await import("../services/email.service.js");
  console.log("✅ Email service imported successfully");
} catch (error) {
  console.error("❌ Email service import failed:", error);
}
