import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

// Import Middlewares
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import nomineeRoutes from "./routes/nomineeRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import accessRequestRoutes from "./routes/accessRequestRoutes.js";

const app = express();

app.set("trust proxy", 1);

// Security Middlewares
app.use(helmet());

// CORS configuration matching CLIENT_URL
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // liberal limit for testing
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    errorCode: "TOO_MANY_REQUESTS",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "UP", time: new Date() });
});

// Routes Registration
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/nominees", nomineeRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/access-requests", accessRequestRoutes);

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
