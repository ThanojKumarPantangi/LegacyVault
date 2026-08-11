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
