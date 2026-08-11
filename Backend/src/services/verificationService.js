import { User } from "../models/User.js";
import { Policy } from "../models/Policy.js";
import { Nominee } from "../models/Nominee.js";
import { Asset } from "../models/Asset.js";
import { VerificationCase } from "../models/VerificationCase.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { decrypt, decryptBuffer } from "./encryptionService.js";
import { getFile } from "./storageService.js";
import {
  sendNomineeNotification,
  sendAccessRequestedNotification,
  sendAccessApprovedNotification,
  sendAccessRejectedNotification,
} from "./notificationService.js";
import { logAuditEvent } from "./auditService.js";

/**
 * Scheduled job logic checking user inactivity.
 */
export const processInactiveUsers = async () => {
  const users = await User.find({ role: "USER" });
  let triggeredCount = 0;

  for (const user of users) {
    // Find all active policies for this owner
    const policies = await Policy.find({ ownerId: user._id, status: "ACTIVE" });
    if (policies.length === 0) continue;

    const timeDiffMs = Date.now() - new Date(user.lastActiveAt).getTime();
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

    for (const policy of policies) {
      if (timeDiffDays >= policy.inactivityDays) {
        // Inactivity period met. Check if verification case already exists
        const existingCase = await VerificationCase.findOne({
          ownerId: user._id,
          status: { $in: ["VERIFICATION_REQUIRED", "NOMINEE_REQUESTED", "ADMIN_REVIEW", "APPROVED", "RELEASED"] },
        });

        if (!existingCase) {
          // Trigger new verification case
          const vCase = new VerificationCase({
            ownerId: user._id,
            status: "VERIFICATION_REQUIRED",
            triggerType: "INACTIVITY",
            metadata: {
              inactivityDays: policy.inactivityDays,
              lastActiveAt: user.lastActiveAt,
            },
          });
          await vCase.save();
          triggeredCount++;

          // Notify nominee
          const nominee = await Nominee.findById(policy.nomineeId);
          if (nominee) {
            await sendNomineeNotification(
              nominee.email,
              nominee.name,
              user.name,
              policy.inactivityDays
            );
          }

          // Audit log
          await logAuditEvent({
            action: "VERIFICATION_STARTED",
            resourceType: "VerificationCase",
            resourceId: vCase._id,
            metadata: { ownerId: user._id, policyId: policy._id },
          });
        }
      }
    }
  }

  return { processed: users.length, triggered: triggeredCount };
};

/**
 * Nominee: Discover inheritances triggered by owner inactivity.
 */
export const getAvailableInheritancesForNominee = async (nomineeUserId) => {
  // Find Nominee mappings matching the nomineeUserId
  const nominees = await Nominee.find({ nomineeUserId });
  const inheritances = [];

  for (const nominee of nominees) {
    // Check if there is an active verification case for this owner
    const vCase = await VerificationCase.findOne({
      ownerId: nominee.ownerId,
      status: { $in: ["VERIFICATION_REQUIRED", "NOMINEE_REQUESTED", "ADMIN_REVIEW", "APPROVED", "RELEASED"] },
    });

    if (vCase) {
      // Find the policy linking owner to this nominee
      const policy = await Policy.findOne({
        ownerId: nominee.ownerId,
        nomineeId: nominee._id,
        status: "ACTIVE",
      }).populate("assets");

      if (policy) {
        // Find existing access requests to determine current request statuses
        const requests = await AccessRequest.find({
          ownerId: nominee.ownerId,
          nomineeId: nominee._id,
        });

        // Map assets with basic metadata and request statuses
        const assets = policy.assets.map((asset) => {
          const reqForAsset = requests.find((r) => r.assetId.toString() === asset._id.toString());
          return {
            _id: asset._id,
            title: asset.title,
            category: asset.category,
            description: asset.description,
            hasFile: !!asset.fileMetadata?.filename,
            requestStatus: reqForAsset ? reqForAsset.status : "NONE",
            requestId: reqForAsset ? reqForAsset._id : null,
          };
        });

        // Fetch owner details safely
        const owner = await User.findById(nominee.ownerId).select("name email");

        inheritances.push({
          verificationCaseId: vCase._id,
          verificationStatus: vCase.status,
          owner: {
            id: owner._id,
            name: owner.name,
            email: owner.email,
          },
          relationship: nominee.relationship,
          nomineeId: nominee._id,
          assets,
        });
      }
    }
  }

  return inheritances;
};

/**
 * Nominee: Request access to an assigned asset.
 */
export const requestAccessForNominee = async (nomineeUserId, nomineeId, assetId) => {
  // Verify Nominee entry exists and belongs to the nominee
  const nominee = await Nominee.findOne({ _id: nomineeId, nomineeUserId });
  if (!nominee) {
    const err = new Error("Nominee mapping not found or unauthorized");
    err.statusCode = 404;
    err.errorCode = "NOMINEE_NOT_FOUND";
    throw err;
  }

  // Verify there is an active triggered verification case for this owner
  const vCase = await VerificationCase.findOne({
    ownerId: nominee.ownerId,
    status: { $in: ["VERIFICATION_REQUIRED", "NOMINEE_REQUESTED", "ADMIN_REVIEW"] },
  });

  if (!vCase) {
    const err = new Error("No active verification workflow found for this owner");
    err.statusCode = 400;
    err.errorCode = "NO_ACTIVE_VERIFICATION";
    throw err;
  }

  // Verify asset belongs to owner and is assigned to nominee in policy
  const policy = await Policy.findOne({
    ownerId: nominee.ownerId,
    nomineeId: nominee._id,
    assets: assetId,
    status: "ACTIVE",
  });

  if (!policy) {
    const err = new Error("Asset is not assigned to you or policy is inactive");
    err.statusCode = 400;
    err.errorCode = "UNAUTHORIZED_ASSET_REQUEST";
    throw err;
  }

  // Check duplicate access request
  const existingRequest = await AccessRequest.findOne({
    nomineeId: nominee._id,
    assetId,
    status: { $in: ["PENDING", "ADMIN_REVIEW", "APPROVED", "RELEASED"] },
  });

  if (existingRequest) {
    const err = new Error("Access request already submitted or approved for this asset");
    err.statusCode = 400;
    err.errorCode = "DUPLICATE_REQUEST";
    throw err;
  }

  // Create AccessRequest
  const request = new AccessRequest({
    ownerId: nominee.ownerId,
    nomineeId: nominee._id,
    assetId,
    verificationCaseId: vCase._id,
    status: "ADMIN_REVIEW",
  });

  await request.save();

  // Update VerificationCase state
  vCase.status = "NOMINEE_REQUESTED";
  await vCase.save();

  // Notify Administrators (we send to any ADMIN role users in database)
  const admins = await User.find({ role: "ADMIN" }).select("email");
  const adminEmails = admins.map((a) => a.email);
  const asset = await Asset.findById(assetId);
  const owner = await User.findById(nominee.ownerId);

  if (adminEmails.length > 0 && asset && owner) {
    await sendAccessRequestedNotification(
      adminEmails,
      nominee.name,
      owner.name,
      asset.title
    );
  }

  // Audit log
  await logAuditEvent({
    actorId: nomineeUserId,
    action: "ACCESS_REQUESTED",
    resourceType: "AccessRequest",
    resourceId: request._id,
    metadata: { nomineeId: nominee._id, assetId },
  });

  return request;
};

/**
 * Admin: Retrieve all nominee access requests.
 */
export const getAccessRequestsForAdmin = async () => {
  return await AccessRequest.find()
    .populate({ path: "ownerId", select: "name email" })
    .populate({ path: "nomineeId", select: "name email relationship" })
    .populate({ path: "assetId", select: "title category description" })
    .sort({ createdAt: -1 });
};

/**
 * Admin: Approve or Reject a nominee request.
 */
export const reviewAccessRequest = async (adminId, requestId, action, rejectReason) => {
  const request = await AccessRequest.findById(requestId);
  if (!request) {
    const err = new Error("Access request not found");
    err.statusCode = 404;
    err.errorCode = "REQUEST_NOT_FOUND";
    throw err;
  }

  if (request.status !== "ADMIN_REVIEW" && request.status !== "PENDING") {
    const err = new Error("Request has already been processed");
    err.statusCode = 400;
    err.errorCode = "REQUEST_ALREADY_PROCESSED";
    throw err;
  }

  const nominee = await Nominee.findById(request.nomineeId);
  const asset = await Asset.findById(request.assetId);
  const owner = await User.findById(request.ownerId);
  const vCase = await VerificationCase.findById(request.verificationCaseId);

  if (action === "APPROVE") {
    request.status = "APPROVED";
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    await request.save();

    // Update VerificationCase
    if (vCase) {
      vCase.status = "APPROVED";
      vCase.reviewedAt = new Date();
      await vCase.save();
    }

    if (nominee && asset && owner) {
      await sendAccessApprovedNotification(
        nominee.email,
        nominee.name,
        asset.title,
        owner.name
      );
    }

    // Audit log
    await logAuditEvent({
      actorId: adminId,
      action: "ACCESS_APPROVED",
      resourceType: "AccessRequest",
      resourceId: request._id,
      metadata: { nomineeId: request.nomineeId, assetId: request.assetId },
    });
  } else if (action === "REJECT") {
    request.status = "REJECTED";
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    await request.save();

    // Update VerificationCase
    if (vCase) {
      vCase.status = "REJECTED";
      vCase.reviewedAt = new Date();
      await vCase.save();
    }

    if (nominee && asset && owner) {
      await sendAccessRejectedNotification(
        nominee.email,
        nominee.name,
        asset.title,
        owner.name,
        rejectReason
      );
    }

    // Audit log
    await logAuditEvent({
      actorId: adminId,
      action: "ACCESS_REJECTED",
      resourceType: "AccessRequest",
      resourceId: request._id,
      metadata: { nomineeId: request.nomineeId, assetId: request.assetId, reason: rejectReason },
    });
  } else {
    const err = new Error("Invalid review action. Must be APPROVE or REJECT.");
    err.statusCode = 400;
    throw err;
  }

  return request;
};

/**
 * Nominee: Retrieve decypted asset contents. Enforces strict authorization.
 */
export const releaseAssetToNominee = async (nomineeUserId, assetId) => {
  // Find Nominee profiles matching this nomineeUserId
  const nominees = await Nominee.find({ nomineeUserId });
  const nomineeIds = nominees.map((n) => n._id.toString());

  // Confirm approved AccessRequest exists for this nominee list and asset
  const request = await AccessRequest.findOne({
    nomineeId: { $in: nomineeIds },
    assetId,
    status: "APPROVED",
  });

  if (!request) {
    const err = new Error("Access denied. No approved request found for this asset.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  // Fetch asset and verify owner link
  const asset = await Asset.findById(assetId);
  if (!asset || asset.ownerId.toString() !== request.ownerId.toString()) {
    const err = new Error("Asset mismatch or corrupted policy");
    err.statusCode = 400;
    err.errorCode = "ASSET_CORRUPTED";
    throw err;
  }

  const assetObj = asset.toObject();

  // Decrypt the text content
  if (assetObj.encryptedData && assetObj.encryptedData.ciphertext) {
    assetObj.sensitiveData = decrypt(
      assetObj.encryptedData.ciphertext,
      assetObj.encryptedData.iv,
      assetObj.encryptedData.tag
    );
  }

  // Update AccessRequest status to RELEASED
  request.status = "RELEASED";
  request.releasedAt = new Date();
  await request.save();

  // Update VerificationCase
  const vCase = await VerificationCase.findById(request.verificationCaseId);
  if (vCase && vCase.status !== "RELEASED") {
    vCase.status = "RELEASED";
    vCase.completedAt = new Date();
    await vCase.save();
  }

  // Audit log
  await logAuditEvent({
    actorId: nomineeUserId,
    action: "ASSET_RELEASED",
    resourceType: "Asset",
    resourceId: asset._id,
    metadata: { nomineeId: request.nomineeId, accessRequestId: request._id },
  });

  return assetObj;
};

/**
 * Nominee: Download decrypted file. Enforces strict authorization.
 */
export const releaseAssetFileToNominee = async (nomineeUserId, assetId) => {
  const nominees = await Nominee.find({ nomineeUserId });
  const nomineeIds = nominees.map((n) => n._id.toString());

  // Access check
  const request = await AccessRequest.findOne({
    nomineeId: { $in: nomineeIds },
    assetId,
    status: { $in: ["APPROVED", "RELEASED"] },
  });

  if (!request) {
    const err = new Error("Access denied. No approved request found for this file.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const asset = await Asset.findById(assetId);
  if (!asset || !asset.fileMetadata || !asset.fileMetadata.filename) {
    const err = new Error("No file associated with this asset");
    err.statusCode = 404;
    err.errorCode = "FILE_NOT_FOUND";
    throw err;
  }

  const encryptedBuffer = await getFile(asset.fileMetadata.filename);
  const decryptedBuffer = decryptBuffer(
    encryptedBuffer,
    asset.fileMetadata.iv,
    asset.fileMetadata.tag
  );

  // Audit log
  await logAuditEvent({
    actorId: nomineeUserId,
    action: "ASSET_DOWNLOADED",
    resourceType: "Asset",
    resourceId: asset._id,
    metadata: { nomineeId: request.nomineeId, accessRequestId: request._id },
  });

  return {
    buffer: decryptedBuffer,
    originalName: asset.fileMetadata.originalName,
    mimeType: asset.fileMetadata.mimeType,
  };
};
