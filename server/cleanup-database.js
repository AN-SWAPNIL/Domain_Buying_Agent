import mongoose from "mongoose";
import dotenv from "dotenv";
import Domain from "./models/Domain.model.js";
import Transaction from "./models/Transaction.model.js";

// Load environment variables
dotenv.config();

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Delete all domains and transactions
    const domainResult = await Domain.deleteMany({});
    const transactionResult = await Transaction.deleteMany({});

    console.log(`🗑️ Deleted ${domainResult.deletedCount} domains`);
    console.log(`🗑️ Deleted ${transactionResult.deletedCount} transactions`);
    console.log("✅ Database cleaned successfully");

    // Close connection
    await mongoose.connection.close();
    console.log("📤 Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanupDatabase();
