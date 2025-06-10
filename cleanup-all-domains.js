#!/usr/bin/env node
import mongoose from "mongoose";
import Domain from "./server/models/Domain.model.js";
import Transaction from "./server/models/Transaction.model.js";
import { config } from "dotenv";

// Load environment variables
config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/domain_buying_agent";

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get counts before cleanup
    const domainCount = await Domain.countDocuments();
    const transactionCount = await Transaction.countDocuments();

    console.log(`\n📊 Current database state:`);
    console.log(`   - Domains: ${domainCount}`);
    console.log(`   - Transactions: ${transactionCount}`);

    if (domainCount === 0 && transactionCount === 0) {
      console.log("\n✨ Database is already clean!");
      return;
    }

    // Show some examples of what will be deleted
    console.log("\n🔍 Sample domains to be deleted:");
    const sampleDomains = await Domain.find()
      .limit(5)
      .select("fullDomain status owner");
    sampleDomains.forEach((domain) => {
      console.log(`   - ${domain.fullDomain} (${domain.status})`);
    });

    // Confirm deletion
    console.log(
      "\n⚠️  This will DELETE ALL domains and transactions from the database!"
    );
    console.log("💡 This is useful for starting fresh with clean data.");

    // For automated cleanup, we'll proceed without confirmation
    console.log("\n🗑️  Proceeding with cleanup...");

    // Delete all transactions first (to avoid foreign key issues)
    console.log("\n🧹 Deleting all transactions...");
    const deletedTransactions = await Transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.deletedCount} transactions`);

    // Delete all domains
    console.log("\n🧹 Deleting all domains...");
    const deletedDomains = await Domain.deleteMany({});
    console.log(`✅ Deleted ${deletedDomains.deletedCount} domains`);

    // Verify cleanup
    const remainingDomains = await Domain.countDocuments();
    const remainingTransactions = await Transaction.countDocuments();

    console.log(`\n📊 Final database state:`);
    console.log(`   - Domains: ${remainingDomains}`);
    console.log(`   - Transactions: ${remainingTransactions}`);

    if (remainingDomains === 0 && remainingTransactions === 0) {
      console.log("\n🎉 Database cleanup completed successfully!");
      console.log("✨ You can now start fresh with clean domain data.");
    } else {
      console.log("\n⚠️  Some records may still remain in the database.");
    }
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    console.error("🔧 Error details:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the cleanup
cleanupDatabase();
