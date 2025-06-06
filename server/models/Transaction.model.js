import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase", "renewal", "transfer", "refund"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    amount: {
      value: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "crypto"],
      default: "stripe",
    },
    paymentDetails: {
      stripePaymentIntentId: String,
      stripeChargeId: String,
      last4: String,
      brand: String,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      referrer: String,
    },
    receipt: {
      url: String,
      emailSent: {
        type: Boolean,
        default: false,
      },
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ domain: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

export default mongoose.model("Transaction", transactionSchema);
