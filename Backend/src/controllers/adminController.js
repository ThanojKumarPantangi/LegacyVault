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
  // if (process.env.NODE_ENV === "production") {
  //   const err = new Error(
  //     "Simulation is disabled in production environments."
  //   );
  //   err.statusCode = 403;
  //   err.errorCode = "SIMULATION_DISABLED";
  //   throw err;
  // }

  const {
    simulationStage,
    email,
    inactivityDays,
  } = req.body;

  const validStages = [
    "OWNER_INACTIVITY",
    "OWNER_RESPONSE_TIMEOUT",
    "NOMINEE_RESPONSE_TIMEOUT",
  ];

  if (!simulationStage || !email) {
    const err = new Error(
      "simulationStage and email are required"
    );
    err.statusCode = 400;
    throw err;
  }

  if (!validStages.includes(simulationStage)) {
    const err = new Error("Invalid simulation stage");
    err.statusCode = 400;
    throw err;
  }

  const days = Number(inactivityDays);

  if (!Number.isFinite(days) || days < 1) {
    const err = new Error(
      "inactivityDays must be a valid number greater than 0"
    );
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  /*
   * ---------------------------------------------------------
   * 1. INITIAL OWNER INACTIVITY
   * ---------------------------------------------------------
   */
  if (simulationStage === "OWNER_INACTIVITY") {
    const activePolicy = await Policy.exists({
      ownerId: user._id,
      status: "ACTIVE",
      triggerType: "INACTIVITY",
    });

    if (!activePolicy) {
      const err = new Error(
        "This owner does not have an active inactivity policy."
      );
      err.statusCode = 400;
      throw err;
    }

    const simulatedLastActiveAt = new Date(
      Date.now() -
        days * 24 * 60 * 60 * 1000 -
        60 * 1000
    );

    user.lastActiveAt = simulatedLastActiveAt;
    await user.save();

    const result =
      await verificationService.processInactiveUsers(
        user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Owner inactivity simulated successfully. The owner verification workflow was processed.",
      data: {
        simulationStage,
        userId: user._id,
        email: user.email,
        lastActiveAt: user.lastActiveAt,
        triggered: result?.triggered ?? 0,
      },
    });
  }

  /*
   * ---------------------------------------------------------
   * 2. OWNER RESPONSE TIMEOUT
   * ---------------------------------------------------------
   */
  if (simulationStage === "OWNER_RESPONSE_TIMEOUT") {
    const activeCase =
      await VerificationCase.findOne({
        ownerId: user._id,
        status: "OWNER_CONFIRMATION_PENDING",
      });

    if (!activeCase) {
      const err = new Error(
        "No OWNER_CONFIRMATION_PENDING verification case exists for this owner."
      );
      err.statusCode = 404;
      throw err;
    }

    activeCase.ownerResponseDeadline = new Date(
      Date.now() - 1000
    );

    await activeCase.save();

    const result =
      await verificationService.processInactiveUsers(
        user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Owner response timeout simulated. The nominee confirmation stage was processed.",
      data: {
        simulationStage,
        verificationCaseId: activeCase._id,
        status: activeCase.status,
        triggered: result?.triggered ?? 0,
      },
    });
  }

  /*
   * ---------------------------------------------------------
   * 3. NOMINEE RESPONSE TIMEOUT
   * ---------------------------------------------------------
   */
  if (simulationStage === "NOMINEE_RESPONSE_TIMEOUT") {
    // The email entered in the simulator is the NOMINEE's email.
    const nominee = await Nominee.findOne({
      nomineeUserId: user._id,
      status: "ACTIVE",
    });

    if (!nominee) {
      const err = new Error(
        "This user is not registered as an active nominee."
      );
      err.statusCode = 404;
      throw err;
    }

    const activeCase = await VerificationCase.findOne({
      nomineeId: nominee._id,
      status: "NOMINEE_CONFIRMATION_PENDING",
    });

    if (!activeCase) {
      const err = new Error(
        "No NOMINEE_CONFIRMATION_PENDING verification case exists for this nominee."
      );
      err.statusCode = 404;
      throw err;
    }

    // Force nominee response deadline into the past.
    activeCase.nomineeResponseDeadline = new Date(Date.now() - 1000);

    await activeCase.save();

    // Process ONLY this owner's workflow.
    const result =
      await verificationService.processInactiveUsers(
        activeCase.ownerId
      );

    return res.status(200).json({
      success: true,
      message:
        "Nominee response timeout simulated. Automatic asset release processing was triggered.",
      data: {
        simulationStage,
        verificationCaseId: activeCase._id,
        nomineeId: nominee._id,
        status: activeCase.status,
        triggered: result?.triggered ?? 0,
      },
    });
  }
  
});