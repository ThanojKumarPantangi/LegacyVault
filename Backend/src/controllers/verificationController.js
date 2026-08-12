import { asyncHandler } from "../utils/asyncHandler.js";
import * as verificationService from "../services/verificationService.js";

export const getAvailableInheritances = asyncHandler(async (req, res) => {
  const data = await verificationService.getAvailableInheritancesForNominee(
    req.user._id
  );
  res.status(200).json({
    success: true,
    data,
  });
});

export const submitAccessRequest = asyncHandler(async (req, res) => {
  const { nomineeId, assetId } = req.body;

  if (!nomineeId || !assetId) {
    const err = new Error("NomineeId and assetId are required");
    err.statusCode = 400;
    throw err;
  }

  const request = await verificationService.requestAccessForNominee(
    req.user._id,
    nomineeId,
    assetId
  );

  res.status(201).json({
    success: true,
    message: "Access request submitted successfully for administrator review.",
    data: request,
  });
});

export const getReleasedAsset = asyncHandler(async (req, res) => {
  const asset = await verificationService.releaseAssetToNominee(
    req.user._id,
    req.params.assetId
  );

  res.status(200).json({
    success: true,
    data: asset,
  });
});

export const downloadReleasedFile = asyncHandler(async (req, res) => {
  const fileData = await verificationService.releaseAssetFileToNominee(
    req.user._id,
    req.params.assetId
  );

  res.setHeader("Content-Disposition", `attachment; filename="${fileData.originalName}"`);
  res.setHeader("Content-Type", fileData.mimeType);
  res.send(fileData.buffer);
});

export const handleOwnerResponse = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    const err = new Error("Token is required");
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = await verificationService.respondOwnerAvailability(token);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to confirm availability.",
      errorCode: err.errorCode || "CONFIRMATION_FAILED"
    });
  }
});

export const handleNomineeResponse = asyncHandler(async (req, res) => {
  const { token, choice } = req.body;
  if (!token || !choice) {
    const err = new Error("Token and choice are required");
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = await verificationService.respondNomineeAvailability(token, choice);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to confirm availability.",
      errorCode: err.errorCode || "CONFIRMATION_FAILED"
    });
  }
});
