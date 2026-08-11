import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import { logAuditEvent } from "../services/auditService.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    const err = new Error("Name, email, and password are required");
    err.statusCode = 400;
    throw err;
  }

  const { user, token } = await authService.registerUser({
    name,
    email,
    password,
    role,
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user, token },
  });
});

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

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);
  res.status(200).json({
    success: true,
    data: user,
  });
});
