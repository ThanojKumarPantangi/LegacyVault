import { AuditLog } from "../models/AuditLog.js";

/**
 * Creates a structured audit log entry for security-sensitive operations.
 * @param {object} params - Audit log parameters
 */
export const logAuditEvent = async ({
  actorId,
  action,
  resourceType,
  resourceId,
  metadata,
  ipAddress,
  userAgent,
}) => {
  try {
    // Sanitize metadata to remove secrets
    const sanitizedMetadata = { ...metadata };
    if (sanitizedMetadata) {
      delete sanitizedMetadata.password;
      delete sanitizedMetadata.token;
      delete sanitizedMetadata.jwt;
      delete sanitizedMetadata.key;
      delete sanitizedMetadata.encryptionKey;
      delete sanitizedMetadata.decryptedData;
    }

    const log = new AuditLog({
      actorId,
      action,
      resourceType,
      resourceId,
      metadata: sanitizedMetadata,
      ipAddress,
      userAgent,
    });

    await log.save();
  } catch (error) {
    console.error("[AUDIT ERROR] Failed to record audit log:", error.message);
  }
};
