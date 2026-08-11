import { asyncHandler } from "../utils/asyncHandler.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { Nominee } from "../models/Nominee.js";
import * as verificationService from "../services/verificationService.js";

export const createAccessRequest = asyncHandler(async (req, res) => {
  const { nomineeId, assetId } = req.body;

  if (!nomineeId || !assetId) {
    const err = new Error("NomineeId and assetId are required");
    err.statusCode = 400;
    throw err;
  }

  // Submit via service
  const request = await verificationService.requestAccessForNominee(
    req.user._id, // nomineeUserId
    nomineeId,
    assetId
  );

  res.status(201).json({
    success: true,
    message: "Access request submitted successfully.",
    data: request,
  });
});

export const getAccessRequests = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === "USER") {
    // Owner sees requests targeting their assets
    filter = { ownerId: req.user._id };
  } else if (req.user.role === "NOMINEE") {
    // Nominee sees requests they have submitted
    const nomineeProfiles = await Nominee.find({ nomineeUserId: req.user._id });
    const nomineeIds = nomineeProfiles.map((n) => n._id);
    filter = { nomineeId: { $in: nomineeIds } };
  } else {
    // Admin sees all (though admins should use /api/admin/access-requests, we support general listing)
    filter = {};
  }

  const requests = await AccessRequest.find(filter)
    .populate({ path: "ownerId", select: "name email" })
    .populate({ path: "nomineeId", select: "name email relationship" })
    .populate({ path: "assetId", select: "title category description" })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const getAccessRequestById = asyncHandler(async (req, res) => {
  const request = await AccessRequest.findById(req.params.id)
    .populate({ path: "ownerId", select: "name email" })
    .populate({ path: "nomineeId", select: "name email relationship" })
    .populate({ path: "assetId", select: "title category description" });

  if (!request) {
    const err = new Error("Access request not found");
    err.statusCode = 404;
    err.errorCode = "REQUEST_NOT_FOUND";
    throw err;
  }

  // Authorization check: User must be owner, nominee, or admin
  const nomineeProfiles = await Nominee.find({ nomineeUserId: req.user._id });
  const nomineeIds = nomineeProfiles.map((n) => n._id.toString());
  const isAuthorized =
    req.user.role === "ADMIN" ||
    request.ownerId._id.toString() === req.user._id.toString() ||
    nomineeIds.includes(request.nomineeId._id.toString());

  if (!isAuthorized) {
    const err = new Error("Access denied. Unauthorized to view request details.");
    err.statusCode = 403;
    err.errorCode = "FORBIDDEN";
    throw err;
  }

  res.status(200).json({
    success: true,
    data: request,
  });
});
