import { Asset } from "../models/Asset.js";
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from "./encryptionService.js";
import { saveFile, getFile, deleteFile } from "./storageService.js";

/**
 * Creates a digital asset, encrypting sensitive fields and file attachments.
 */
export const createAsset = async (ownerId, { title, category, description, sensitiveData }, file) => {
  let encryptedData = undefined;
  let fileMetadata = undefined;

  // Encrypt text data if present
  if (sensitiveData) {
    encryptedData = encrypt(sensitiveData);
  }

  // Encrypt and save file if present
  if (file) {
    const fileResult = encryptBuffer(file.buffer);
    const diskFilename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await saveFile(diskFilename, fileResult.encryptedBuffer);

    fileMetadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filename: diskFilename,
      iv: fileResult.iv,
      tag: fileResult.tag,
    };
  }

  const asset = new Asset({
    ownerId,
    title,
    category,
    description,
    encryptedData,
    fileMetadata,
    status: "ACTIVE",
  });

  await asset.save();
  return asset;
};

/**
 * Retrieves all assets owned by a specific user (does not decrypt sensitive fields).
 */
export const getAssetsByOwner = async (ownerId) => {
  return await Asset.find({ ownerId });
};

/**
 * Retrieves a single asset and decrypts its sensitive data (verifies ownerId).
 */
export const getAssetById = async (ownerId, assetId) => {
  const asset = await Asset.findOne({ _id: assetId, ownerId });
  if (!asset) {
    const err = new Error("Asset not found or unauthorized");
    err.statusCode = 404;
    err.errorCode = "ASSET_NOT_FOUND";
    throw err;
  }

  const assetObj = asset.toObject();

  if (assetObj.encryptedData && assetObj.encryptedData.ciphertext) {
    assetObj.sensitiveData = decrypt(
      assetObj.encryptedData.ciphertext,
      assetObj.encryptedData.iv,
      assetObj.encryptedData.tag
    );
  }

  return assetObj;
};

/**
 * Updates an asset. Re-encrypts text data if provided.
 */
export const updateAsset = async (ownerId, assetId, { title, category, description, sensitiveData }) => {
  const asset = await Asset.findOne({ _id: assetId, ownerId });
  if (!asset) {
    const err = new Error("Asset not found or unauthorized");
    err.statusCode = 404;
    err.errorCode = "ASSET_NOT_FOUND";
    throw err;
  }

  if (title) asset.title = title;
  if (category) asset.category = category;
  if (description !== undefined) asset.description = description;

  if (sensitiveData) {
    asset.encryptedData = encrypt(sensitiveData);
  }

  await asset.save();
  return asset;
};

/**
 * Deletes an asset, removing its files from disk.
 */
export const deleteAsset = async (ownerId, assetId) => {
  const asset = await Asset.findOne({ _id: assetId, ownerId });
  if (!asset) {
    const err = new Error("Asset not found or unauthorized");
    err.statusCode = 404;
    err.errorCode = "ASSET_NOT_FOUND";
    throw err;
  }

  if (asset.fileMetadata && asset.fileMetadata.filename) {
    await deleteFile(asset.fileMetadata.filename);
  }

  await asset.deleteOne();
  return { success: true };
};

/**
 * Retrieves and decrypts the file associated with the asset for the owner.
 */
export const getAssetFile = async (ownerId, assetId) => {
  const asset = await Asset.findOne({ _id: assetId, ownerId });
  if (!asset) {
    const err = new Error("Asset not found or unauthorized");
    err.statusCode = 404;
    err.errorCode = "ASSET_NOT_FOUND";
    throw err;
  }

  if (!asset.fileMetadata || !asset.fileMetadata.filename) {
    const err = new Error("No file attached to this asset");
    err.statusCode = 400;
    err.errorCode = "NO_FILE_ATTACHED";
    throw err;
  }

  const encryptedBuffer = await getFile(asset.fileMetadata.filename);
  const decryptedBuffer = decryptBuffer(
    encryptedBuffer,
    asset.fileMetadata.iv,
    asset.fileMetadata.tag
  );

  return {
    buffer: decryptedBuffer,
    originalName: asset.fileMetadata.originalName,
    mimeType: asset.fileMetadata.mimeType,
  };
};
