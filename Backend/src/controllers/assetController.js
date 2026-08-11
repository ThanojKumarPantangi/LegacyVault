import { asyncHandler } from "../utils/asyncHandler.js";
import * as assetService from "../services/assetService.js";
import { logAuditEvent } from "../services/auditService.js";

export const createAsset = asyncHandler(async (req, res) => {
  const { title, category, description, sensitiveData } = req.body;
  const file = req.file;

  if (!title || !category) {
    const err = new Error("Title and category are required");
    err.statusCode = 400;
    throw err;
  }

  const asset = await assetService.createAsset(
    req.user._id,
    { title, category, description, sensitiveData },
    file
  );

  await logAuditEvent({
    actorId: req.user._id,
    action: "ASSET_CREATED",
    resourceType: "Asset",
    resourceId: asset._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    message: "Asset created successfully",
    data: asset,
  });
});

export const getAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.getAssetsByOwner(req.user._id);
  res.status(200).json({
    success: true,
    data: assets,
  });
});

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.user._id, req.params.id);

  await logAuditEvent({
    actorId: req.user._id,
    action: "ASSET_VIEWED",
    resourceType: "Asset",
    resourceId: asset._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: asset,
  });
});

export const updateAsset = asyncHandler(async (req, res) => {
  const { title, category, description, sensitiveData } = req.body;
  const asset = await assetService.updateAsset(req.user._id, req.params.id, {
    title,
    category,
    description,
    sensitiveData,
  });

  await logAuditEvent({
    actorId: req.user._id,
    action: "ASSET_UPDATED",
    resourceType: "Asset",
    resourceId: asset._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Asset updated successfully",
    data: asset,
  });
});

export const deleteAsset = asyncHandler(async (req, res) => {
  await assetService.deleteAsset(req.user._id, req.params.id);

  await logAuditEvent({
    actorId: req.user._id,
    action: "ASSET_DELETED",
    resourceType: "Asset",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Asset deleted successfully",
  });
});

export const downloadAssetFile = asyncHandler(async (req, res) => {
  const fileData = await assetService.getAssetFile(req.user._id, req.params.id);

  await logAuditEvent({
    actorId: req.user._id,
    action: "ASSET_DOWNLOADED",
    resourceType: "Asset",
    resourceId: req.params.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.setHeader("Content-Disposition", `attachment; filename="${fileData.originalName}"`);
  res.setHeader("Content-Type", fileData.mimeType);
  res.send(fileData.buffer);
});
