import { asyncHandler } from "../utils/asyncHandler.js";
import * as policyService from "../services/policyService.js";
import { logAuditEvent } from "../services/auditService.js";

export const createPolicy = asyncHandler(async (req, res) => {
  const { nomineeId, inactivityDays, assets, adminApprovalRequired } = req.body;

  if (!nomineeId || !inactivityDays) {
    const err = new Error("NomineeId and inactivityDays are required");
    err.statusCode = 400;
    throw err;
  }

  const policy = await policyService.createPolicy(req.user._id, {
    nomineeId,
    inactivityDays: Number(inactivityDays),
    assets,
    adminApprovalRequired,
  });

  await logAuditEvent({
    actorId: req.user._id,
    action: "POLICY_CREATED",
    resourceType: "Policy",
    resourceId: policy._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    message: "Inheritance policy created successfully",
    data: policy,
  });
});

export const getPolicies = asyncHandler(async (req, res) => {
  const policies = await policyService.getPolicies(req.user._id);
  res.status(200).json({
    success: true,
    data: policies,
  });
});

export const getPolicyById = asyncHandler(async (req, res) => {
  const policy = await policyService.getPolicyById(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    data: policy,
  });
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const { nomineeId, inactivityDays, assets, adminApprovalRequired, status } = req.body;

  const policy = await policyService.updatePolicy(req.user._id, req.params.id, {
    nomineeId,
    inactivityDays: inactivityDays ? Number(inactivityDays) : undefined,
    assets,
    adminApprovalRequired,
    status,
  });

  await logAuditEvent({
    actorId: req.user._id,
    action: "POLICY_UPDATED",
    resourceType: "Policy",
    resourceId: policy._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Inheritance policy updated successfully",
    data: policy,
  });
});

export const deletePolicy = asyncHandler(async (req, res) => {
  await policyService.deletePolicy(req.user._id, req.params.id);

  await logAuditEvent({
    actorId: req.user._id,
    action: "POLICY_DELETED",
    resourceType: "Policy",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Inheritance policy deleted successfully",
  });
});
