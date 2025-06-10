import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const domainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Domain name is required"],
      lowercase: true,
      trim: true,
    },
    extension: {
      type: String,
      required: [true, "Domain extension is required"],
      lowercase: true,
    },
    fullDomain: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: [
        "available",
        "registered",
        "pending",
        "expired",
        "reserved",
        "payment_completed",
        "refunded",
      ],
      default: "available",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    registrar: {
      type: String,
      enum: ["namecheap", "godaddy", "other"],
      default: "namecheap",
    },
    pricing: {
      cost: {
        type: Number,
        required: true,
      },
      markup: {
        type: Number,
        default: 0,
      },
      sellingPrice: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    registrationDate: Date,
    expirationDate: Date,
    autoRenew: {
      type: Boolean,
      default: false,
    },
    dnsRecords: [
      {
        type: {
          type: String,
          enum: ["A", "AAAA", "CNAME", "MX", "TXT", "NS"],
        },
        name: String,
        value: String,
        ttl: {
          type: Number,
          default: 3600,
        },
      },
    ],
    tags: [String],
    metadata: {
      searchVolume: Number,
      competitionLevel: String,
      suggestedByAI: {
        type: Boolean,
        default: false,
      },
      aiConfidenceScore: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
domainSchema.index({ fullDomain: 1 });
domainSchema.index({ owner: 1 });
domainSchema.index({ status: 1 });
domainSchema.index({ "pricing.sellingPrice": 1 });

// Compound index: Only one registered domain per fullDomain
domainSchema.index(
  { fullDomain: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["registered", "payment_completed"] },
    },
  }
);

// Virtual for formatted price
domainSchema.virtual("formattedPrice").get(function () {
  return `${this.pricing.currency} ${this.pricing.sellingPrice.toFixed(2)}`;
});

// Pre-save middleware to create fullDomain
domainSchema.pre("save", function (next) {
  if (this.name && this.extension) {
    this.fullDomain = `${this.name}.${this.extension}`;
  }
  next();
});

// Add pagination plugin
domainSchema.plugin(mongoosePaginate);

export default mongoose.model("Domain", domainSchema);
