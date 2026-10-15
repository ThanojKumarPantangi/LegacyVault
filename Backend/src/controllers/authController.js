import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import { logAuditEvent } from "../services/auditService.js";

/**
 * Initiates User Registration.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    const err = new Error("Name, email, and password are required");
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.registerUser({
    name,
    email,
    password,
    role,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Verifies Signup Email.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    const err = new Error("Verification token is required");
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.verifyUserEmail(token);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Resends Verification Email.
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.resendVerification(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Requests a Password Reset Link.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Resets password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    const err = new Error("Token and newPassword are required");
    err.statusCode = 400;
    throw err;
  }

  const result = await authService.resetPassword(token, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Login handler.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  const { user, token } = await authService.loginUser({ email, password });

  // Audit Log
  await logAuditEvent({
    actorId: user._id,
    action: "LOGIN",
    resourceType: "User",
    resourceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

/**
 * Logout handler.
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await logAuditEvent({
      actorId: req.user._id,
      action: "LOGOUT",
      resourceType: "User",
      resourceId: req.user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * Get profile handler.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);
  res.status(200).json({
    success: true,
    data: user,
  });
});
