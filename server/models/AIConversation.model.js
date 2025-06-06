import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          model: String,
          tokens: Number,
          confidence: Number,
        },
      },
    ],
    context: {
      intent: String,
      entities: [
        {
          type: String,
          value: String,
          confidence: Number,
        },
      ],
      userPreferences: {
        budget: Number,
        domainTypes: [String],
        industry: String,
      },
    },
    recommendations: [
      {
        domain: String,
        reasoning: String,
        confidence: Number,
        available: Boolean,
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
aiConversationSchema.index({ user: 1, createdAt: -1 });
aiConversationSchema.index({ sessionId: 1 });
aiConversationSchema.index({ status: 1 });

export default mongoose.model("AIConversation", aiConversationSchema);
