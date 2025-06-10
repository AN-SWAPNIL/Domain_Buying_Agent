import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import connectDB from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import domainRoutes from "./routes/domain.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// Trust proxy for ngrok
app.set("trust proxy", true);

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - configured for ngrok proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  trustProxy: true, // Trust ngrok proxy
  keyGenerator: (req) => {
    // Use a combination of IP and forwarded IP for ngrok
    return req.ip || req.connection.remoteAddress || "anonymous";
  },
});
app.use("/api/", limiter);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5176",
  "https://regular-innocent-pony.ngrok-free.app",
  process.env.NGROK_STATIC_URL,
  "https://*.ngrok-free.app",
  "https://*.ngrok.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("🔍 CORS check for origin:", origin);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log("✅ No origin - allowing request");
        return callback(null, true);
      }

      // Check if the origin is in the allowed list or matches ngrok pattern
      const isAllowed = allowedOrigins.some((allowed) => {
        if (!allowed) return false;
        return (
          allowed === origin ||
          (allowed.includes("*") && origin.includes("ngrok")) ||
          origin.includes("regular-innocent-pony.ngrok-free.app")
        );
      });

      if (isAllowed) {
        console.log("✅ Origin allowed:", origin);
        return callback(null, true);
      }

      console.log("❌ Origin rejected:", origin);
      console.log("📋 Allowed origins:", allowedOrigins);
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-stripe-signature",
      "ngrok-skip-browser-warning",
    ],
  })
);

// Stripe webhook endpoint (must be before express.json())
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentRoutes
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Domain Buying Agent Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Debug CORS endpoint
app.get("/debug/cors", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "CORS is working correctly",
    origin: req.get("Origin"),
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});

export default app;
