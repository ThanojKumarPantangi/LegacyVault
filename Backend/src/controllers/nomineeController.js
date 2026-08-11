import { asyncHandler } from "../utils/asyncHandler.js";
import * as nomineeService from "../services/nomineeService.js";
import { logAuditEvent } from "../services/auditService.js";

export const addNominee = asyncHandler(async (req, res) => {
  const { name, email, relationship } = req.body;

  if (!name || !email || !relationship) {
    const err = new Error("Name, email, and relationship are required");
    err.statusCode = 400;
    throw err;
  }

  const nominee = await nomineeService.addNominee(req.user._id, {
    name,
    email,
    relationship,
  });

  await logAuditEvent({
    actorId: req.user._id,
    action: "NOMINEE_ADDED",
    resourceType: "Nominee",
    resourceId: nominee._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    message: "Nominee added successfully",
    data: nominee,
  });
});

export const getNominees = asyncHandler(async (req, res) => {
  const nominees = await nomineeService.getNominees(req.user._id);
  res.status(200).json({
    success: true,
    data: nominees,
  });
});

export const getNomineeById = asyncHandler(async (req, res) => {
  const nominee = await nomineeService.getNomineeById(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    data: nominee,
  });
});

export const updateNominee = asyncHandler(async (req, res) => {
  const { name, email, relationship } = req.body;
  const nominee = await nomineeService.updateNominee(req.user._id, req.params.id, {
    name,
    email,
    relationship,
  });

  await logAuditEvent({
    actorId: req.user._id,
    action: "NOMINEE_UPDATED",
    resourceType: "Nominee",
    resourceId: nominee._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Nominee updated successfully",
    data: nominee,
  });
});

export const deleteNominee = asyncHandler(async (req, res) => {
  await nomineeService.deleteNominee(req.user._id, req.params.id);

  await logAuditEvent({
    actorId: req.user._id,
    action: "NOMINEE_REMOVED",
    resourceType: "Nominee",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Nominee removed successfully",
  });
});
