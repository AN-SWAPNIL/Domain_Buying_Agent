import emailService from "../services/email.service.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function compareTransporters() {
  console.log("🔬 Comparing Transporter Configurations");

  // Working configuration from simple test
  const password = process.env.MAIL_PASSWORD?.replace(/^"|"$/g, "");
  const workingTransporter = nodemailer.createTransport({
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

  try {
    console.log("Testing working transporter...");
    const workingResult = await workingTransporter.verify();
    console.log("Working transporter result:", workingResult);

    console.log("Testing email service transporter...");
    const serviceResult = await emailService.verifyConnection();
    console.log("Service transporter result:", serviceResult);

    // Compare the transporter configurations
    console.log("\n🔍 Configuration Comparison:");
    console.log(
      "Working transporter options:",
      JSON.stringify(workingTransporter.options, null, 2)
    );
    console.log(
      "Service transporter options:",
      JSON.stringify(emailService.transporter.options, null, 2)
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

compareTransporters();
