import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";

// Specific rate limiter for authentication/security endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 requests per 15 minutes
  message: {
    success: false,
    message: "Too many security or auth requests from this IP, please try again later.",
    errorCode: "TOO_MANY_REQUESTS",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

// Public verification and reset endpoints
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationEmail);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
