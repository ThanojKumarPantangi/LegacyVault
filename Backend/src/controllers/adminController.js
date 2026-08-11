import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Asset } from "../models/Asset.js";
import { Nominee } from "../models/Nominee.js";
import { Policy } from "../models/Policy.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { VerificationCase } from "../models/VerificationCase.js";
import { AuditLog } from "../models/AuditLog.js";
import * as verificationService from "../services/verificationService.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments();
  const assetsCount = await Asset.countDocuments();
  const nomineesCount = await Nominee.countDocuments();
  const policiesCount = await Policy.countDocuments();
  const pendingRequestsCount = await AccessRequest.countDocuments({
    status: "ADMIN_REVIEW",
  });
  const verificationCasesCount = await VerificationCase.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      usersCount,
      assetsCount,
      nomineesCount,
      policiesCount,
      pendingRequestsCount,
      verificationCasesCount,
    },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: users,
  });
});

export const getAccessRequests = asyncHandler(async (req, res) => {
  const requests = await verificationService.getAccessRequestsForAdmin();
  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const request = await verificationService.reviewAccessRequest(
    req.user._id,
    req.params.id,
    "APPROVE"
  );
  res.status(200).json({
    success: true,
    message: "Access request approved successfully.",
    data: request,
  });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const request = await verificationService.reviewAccessRequest(
    req.user._id,
    req.params.id,
    "REJECT",
    reason
  );
  res.status(200).json({
    success: true,
    message: "Access request rejected successfully.",
    data: request,
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .populate({ path: "actorId", select: "name email role" })
    .sort({ timestamp: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    data: logs,
  });
});

export const simulateInactivity = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const err = new Error("Simulation is disabled in production environments.");
    err.statusCode = 403;
    throw err;
  }

  const { email, inactivityDays } = req.body;
  if (!email || !inactivityDays) {
    const err = new Error("Email and inactivityDays are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const daysMs = Number(inactivityDays) * 24 * 60 * 60 * 1000;
  user.lastActiveAt = new Date(Date.now() - (daysMs + 10000)); // Subtract days + 10s buffer
  await user.save();

  // Trigger processing immediately
  const result = await verificationService.processInactiveUsers();

  res.status(200).json({
    success: true,
    message: `Simulated inactivity for user ${email}. Inactivity scan completed.`,
    data: {
      userId: user._id,
      lastActiveAt: user.lastActiveAt,
      triggered: result.triggered,
    },
  });
});
