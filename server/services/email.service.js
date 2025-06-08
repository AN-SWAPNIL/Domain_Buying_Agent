import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Remove quotes from password if present
      const password = process.env.MAIL_PASSWORD?.replace(/^"|"$/g, "");

      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: password,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.error("❌ Email service initialization failed:", error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("📧 Email service connection verified");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: {
          name: "Domain Buying Agent",
          address: process.env.MAIL_USERNAME,
        },
        to: userEmail,
        subject: "Password Reset Request - Domain Buying Agent",
        html: this.getPasswordResetTemplate(userName, resetUrl),
        text: `
          Hi ${userName},
          
          You requested a password reset for your Domain Buying Agent account.
          
          Click the link below to reset your password:
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this reset, please ignore this email.
          
          Best regards,
          Domain Buying Agent Team
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        "📧 Password reset email sent successfully:",
        result.messageId
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("❌ Failed to send password reset email:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    try {
      const mailOptions = {
        from: {
          name: "Domain Buying Agent",
          address: process.env.MAIL_USERNAME,
        },
        to: userEmail,
        subject: "Welcome to Domain Buying Agent!",
        html: this.getWelcomeTemplate(userName),
        text: `
          Hi ${userName},
          
          Welcome to Domain Buying Agent! We're excited to have you on board.
          
          With our AI-powered platform, you can:
          - Search and discover perfect domain names
          - Get AI-powered domain suggestions
          - Purchase domains securely
          - Manage your domain portfolio
          
          Get started by exploring our domain search features.
          
          Best regards,
          Domain Buying Agent Team
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("📧 Welcome email sent successfully:", result.messageId);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error);
      // Don't throw error for welcome email to not break registration
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendDomainPurchaseConfirmation(
    userEmail,
    userName,
    domainName,
    amount
  ) {
    try {
      const mailOptions = {
        from: {
          name: "Domain Buying Agent",
          address: process.env.MAIL_USERNAME,
        },
        to: userEmail,
        subject: `Domain Purchase Confirmation - ${domainName}`,
        html: this.getDomainPurchaseTemplate(userName, domainName, amount),
        text: `
          Hi ${userName},
          
          Your domain purchase has been confirmed!
          
          Domain: ${domainName}
          Amount: $${amount}
          
          You can now manage your domain in your dashboard.
          
          Best regards,
          Domain Buying Agent Team
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        "📧 Domain purchase email sent successfully:",
        result.messageId
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error("❌ Failed to send domain purchase email:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getPasswordResetTemplate(userName, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #5a67d8; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Domain Buying Agent</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>You requested a password reset for your Domain Buying Agent account. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset Your Password</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link will expire in <strong>1 hour</strong></li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                
                <p>If you have any questions, feel free to contact our support team.</p>
                
                <p>Best regards,<br>The Domain Buying Agent Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Domain Buying Agent. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getWelcomeTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Domain Buying Agent</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Domain Buying Agent!</h1>
                <p>Your AI-Powered Domain Management Platform</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>Welcome to Domain Buying Agent! We're excited to have you join our community of domain enthusiasts.</p>
                
                <h3>🚀 What you can do with Domain Buying Agent:</h3>
                
                <div class="feature">
                    <h4>🔍 Smart Domain Search</h4>
                    <p>Search for available domains with advanced filtering options</p>
                </div>
                
                <div class="feature">
                    <h4>🤖 AI-Powered Suggestions</h4>
                    <p>Get intelligent domain recommendations based on your business needs</p>
                </div>
                
                <div class="feature">
                    <h4>💳 Secure Purchases</h4>
                    <p>Buy domains securely with our integrated payment system</p>
                </div>
                
                <div class="feature">
                    <h4>📊 Portfolio Management</h4>
                    <p>Manage all your domains from one centralized dashboard</p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.CLIENT_URL}/dashboard" class="button">Get Started Now</a>
                </div>
                
                <p>If you have any questions or need assistance, our support team is here to help!</p>
                
                <p>Happy domain hunting!<br>The Domain Buying Agent Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Domain Buying Agent. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getDomainPurchaseTemplate(userName, domainName, amount) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Domain Purchase Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px 20px; }
            .purchase-details { background: white; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .button { display: inline-block; background: #48bb78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Purchase Confirmed!</h1>
                <p>Domain Buying Agent</p>
            </div>
            <div class="content">
                <h2>Hi ${userName}!</h2>
                <p>Congratulations! Your domain purchase has been successfully confirmed.</p>
                
                <div class="purchase-details">
                    <h3>📄 Purchase Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Domain:</span>
                        <span class="detail-value">${domainName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value">$${amount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">✅ Confirmed</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                <p>Your domain is now available in your dashboard. You can manage DNS settings, renewal options, and more from there.</p>
                
                <div style="text-align: center;">
                    <a href="${
                      process.env.CLIENT_URL
                    }/my-domains" class="button">Manage Your Domains</a>
                </div>
                
                <p>Thank you for choosing Domain Buying Agent!</p>
                
                <p>Best regards,<br>The Domain Buying Agent Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Domain Buying Agent. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

// Create and export singleton instance
const emailService = new EmailService();
export default emailService;
