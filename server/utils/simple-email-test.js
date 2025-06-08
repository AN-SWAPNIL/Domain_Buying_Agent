import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("🔧 Simple Email Test - Checking Basic Configuration");
console.log("MAIL_HOST:", process.env.MAIL_HOST);
console.log("MAIL_PORT:", process.env.MAIL_PORT);
console.log("MAIL_USERNAME:", process.env.MAIL_USERNAME);
console.log("MAIL_PASSWORD exists:", !!process.env.MAIL_PASSWORD);

async function testBasicConnection() {
  try {
    // Remove quotes from password if present
    const password = process.env.MAIL_PASSWORD?.replace(/^"|"$/g, "");

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log("📧 Testing connection...");
    const result = await transporter.verify();
    console.log("✅ Connection successful:", result);

    // Send a simple test email
    console.log("📨 Sending test email...");
    const info = await transporter.sendMail({
      from: `"Domain Buying Agent" <${process.env.MAIL_USERNAME}>`,
      to: process.env.MAIL_USERNAME,
      subject: "Test Email - Domain Buying Agent",
      text: "This is a test email from the Domain Buying Agent application.",
      html: "<p>This is a <b>test email</b> from the Domain Buying Agent application.</p>",
    });

    console.log("✅ Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "EAUTH") {
      console.log("🔑 Authentication failed. Please check:");
      console.log("  - Username and password are correct");
      console.log(
        "  - For Gmail, you need an App Password (not your regular password)"
      );
      console.log(
        "  - Enable 2-Factor Authentication and generate an App Password"
      );
    }
  }
}

testBasicConnection();
