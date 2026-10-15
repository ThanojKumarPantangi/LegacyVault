import crypto from "crypto";
import { User } from "../models/User.js";
import { Policy } from "../models/Policy.js";
import { Nominee } from "../models/Nominee.js";
import { Asset } from "../models/Asset.js";
import { VerificationCase } from "../models/VerificationCase.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { decrypt, decryptBuffer } from "./encryptionService.js";
import { getFile } from "./storageService.js";
import {
  sendOwnerAvailabilityCheck,
  sendOwnerAvailableConfirmation,
  sendNomineeAvailabilityCheck,
  sendNomineeOwnerAvailableNotification,
  sendReleasedAssetsEmail,
} from "./notificationService.js";
import { logAuditEvent } from "./auditService.js";

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Idempotently authorize assets assigned to a nominee inside a policy.
 * VerificationService automatically creates/updates this record internally.
 */
export const authorizeAssetReleaseForCase = async (vCase) => {
  try {
    const policy = await Policy.findById(vCase.policyId).populate("nomineeId ownerId");
    if (!policy) return;

    // Strict validation: Nominee must exist, be ACTIVE, verified, and belong to the correct owner
    const nominee = await Nominee.findById(vCase.nomineeId);
    if (
      !nominee ||
      nominee.status !== "ACTIVE" ||
      nominee.emailVerified !== true ||
      nominee.ownerId.toString() !== vCase.ownerId.toString()
    ) {
      console.warn(`[AUTHORIZATION DENIED] Nominee ${vCase.nomineeId} is not active, verified, or does not belong to owner ${vCase.ownerId}`);
      return;
    }

    const assets = policy.assets || [];
    let allSucceeded = true;

    for (const assetId of assets) {
      // Validate asset exists and belongs to the owner
      const asset = await Asset.findOne({ _id: assetId, ownerId: vCase.ownerId });
      if (!asset) {
        allSucceeded = false;
        console.warn(`[AUTHORIZATION FAILED] Asset ${assetId} not found or does not belong to owner ${vCase.ownerId}`);
        continue;
      }

      // Idempotently upsert/approve the AccessRequest matching case, nominee, and asset
      try {
        await AccessRequest.findOneAndUpdate(
          {
            verificationCaseId: vCase._id,
            nomineeId: vCase.nomineeId,
            assetId: assetId
          },
          {
            $setOnInsert: {
              ownerId: vCase.ownerId,
              verificationCaseId: vCase._id,
              nomineeId: vCase.nomineeId,
              assetId: assetId,
            },
            $set: {
              status: "APPROVED"
            }
          },
          { upsert: true, returnDocument: "after", runValidators: true }
        );
      } catch (dbErr) {
        allSucceeded = false;
        console.error("Database error during AccessRequest upsert:", dbErr.message);
      }
    }

    // Only transition and notify if authorization succeeded for ALL assets
    if (allSucceeded && assets.length > 0) {
      // 1. Prepare attachments for files assigned to this policy
      const attachments = [];
      for (const assetId of assets) {
        try {
          const asset = await Asset.findOne({ _id: assetId, ownerId: vCase.ownerId });
          if (asset && asset.fileMetadata && asset.fileMetadata.filename) {
            const decryptedFile = await getDecryptedAssetFile(asset);
            attachments.push({
              name: decryptedFile.originalName || asset.fileMetadata.originalName,
              content: decryptedFile.buffer.toString("base64")
            });
          }
        } catch (fileErr) {
          // Log failure but do not crash the entire release workflow
          console.error(`[RELEASE EMAIL] Failed to fetch/decrypt file for asset ${assetId}:`, fileErr.message);
        }
      }

      // 2. Send the email if not already sent
      let emailSentAt = vCase.releaseNotificationSentAt || null;
      if (!emailSentAt && policy.nomineeId) {
        try {
          await sendReleasedAssetsEmail(policy.nomineeId.email, policy.nomineeId.name, attachments);
          emailSentAt = new Date();
        } catch (emailErr) {
          console.error("Failed to send release email:", emailErr.message);
          // Do not transition to RELEASED and return early to allow retry on next run
          return;
        }
      }

      // 3. Transition from ASSET_RELEASE_AUTHORIZED to RELEASED conditionally
      const finalizedCase = await VerificationCase.findOneAndUpdate(
        { _id: vCase._id, status: "ASSET_RELEASE_AUTHORIZED" },
        {
          $set: {
            status: "RELEASED",
            completedAt: new Date(),
            releaseNotificationSentAt: emailSentAt
          },
          $unset: {
            ownerTokenHash: 1,
            ownerResponseDeadline: 1,
            nomineeTokenHash: 1,
            nomineeResponseDeadline: 1
          }
        },
        { returnDocument: "after" }
      );

      if (finalizedCase) {
        await logAuditEvent({
          action: "ASSET_RELEASE_AUTHORIZED",
          resourceType: "VerificationCase",
          resourceId: vCase._id,
          metadata: { nomineeId: vCase.nomineeId }
        });

        // Mark policy as COMPLETED to prevent any future inactivity triggers
        policy.status = "COMPLETED";
        await policy.save();

        await logAuditEvent({
          action: "POLICY_COMPLETED",
          resourceType: "Policy",
          resourceId: policy._id,
          metadata: { ownerId: vCase.ownerId }
        });
      }
    }
  } catch (err) {
    console.error("[AUTHORIZATION EXCEPTION]:", err.message);
  }
};

/**
 * Scheduled job logic checking user inactivity.
 * Supports running for all active policies or a single owner (simulation).
 */
export const processInactiveUsers = async (ownerId = null) => {
  let triggeredCount = 0;

  // 1. Scan policies where status is "ACTIVE"
  const policiesQuery = ownerId ? { ownerId, status: "ACTIVE" } : { status: "ACTIVE" };
  const policies = await Policy.find(policiesQuery).populate("nomineeId");

  for (const policy of policies) {
    const nominee = policy.nomineeId;
    // Strictly verify that nominee is ACTIVE and email verified before triggering workflow
    if (!nominee || nominee.status !== "ACTIVE" || nominee.emailVerified !== true) {
      continue;
    }

    const owner = await User.findOne({ _id: policy.ownerId, role: "USER" });
    if (!owner) continue;

    const inactivityDays = policy.inactivityDays || 30;
    const timeDiffMs = Date.now() - new Date(owner.lastActiveAt).getTime();
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

    if (timeDiffDays >= inactivityDays) {
      // Check if an active case exists for this policy.
      const existingCase = await VerificationCase.findOne({
        policyId: policy._id,
        status: { $in: ["OWNER_CONFIRMATION_PENDING", "NOMINEE_CONFIRMATION_PENDING", "ASSET_RELEASE_AUTHORIZED"] }
      });

      if (!existingCase) {
        // Trigger new verification case
        const rawOwnerToken = crypto.randomBytes(32).toString("hex");
        const ownerTokenHash = hashToken(rawOwnerToken);
        const ownerResponseDays = policy.ownerResponseDays || 3;
        const ownerResponseDeadline = new Date(Date.now() + ownerResponseDays * 24 * 60 * 60 * 1000);

        const vCase = new VerificationCase({
          ownerId: owner._id,
          policyId: policy._id,
          nomineeId: nominee._id,
          status: "OWNER_CONFIRMATION_PENDING",
          ownerTokenHash,
          ownerResponseDeadline,
          metadata: {
            inactivityDays,
            lastActiveAt: owner.lastActiveAt,
          }
        });

        try {
          await vCase.save();
          triggeredCount++;

          await logAuditEvent({
            action: "INACTIVITY_DETECTED",
            resourceType: "VerificationCase",
            resourceId: vCase._id,
            metadata: { ownerId: owner._id, policyId: policy._id }
          });

          // Send availability email only to owner
          const respondUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-respond?token=${rawOwnerToken}&type=owner`;
          await sendOwnerAvailabilityCheck(owner.email, owner.name, respondUrl);
          vCase.ownerAvailabilityEmailSentAt = new Date();
          await vCase.save();

          await logAuditEvent({
            action: "OWNER_AVAILABILITY_EMAIL_SENT",
            resourceType: "VerificationCase",
            resourceId: vCase._id,
            metadata: { ownerId: owner._id }
          });
        } catch (saveErr) {
          console.error("Failed to start owner verification:", saveErr.message);
        }
      }
    }
  }

  // 2. Process active cases that need transitions
  // A. Check Owner Response Deadlines
  const ownerPendingQuery = ownerId
    ? { ownerId, status: "OWNER_CONFIRMATION_PENDING", ownerResponseDeadline: { $lte: new Date() } }
    : { status: "OWNER_CONFIRMATION_PENDING", ownerResponseDeadline: { $lte: new Date() } };
  const ownerPendingCases = await VerificationCase.find(ownerPendingQuery);

  for (const vCase of ownerPendingCases) {
    const policy = await Policy.findById(vCase.policyId).populate("nomineeId ownerId");
    if (!policy) continue;

    const nominee = policy.nomineeId;
    if (!nominee) continue;

    const rawNomineeToken = crypto.randomBytes(32).toString("hex");
    const nomineeTokenHash = hashToken(rawNomineeToken);
    const nomineeResponseDays = policy.nomineeResponseDays || 7;
    const nomineeResponseDeadline = new Date(Date.now() + nomineeResponseDays * 24 * 60 * 60 * 1000);

    // Atomically transition status using previous state validation
    const updatedCase = await VerificationCase.findOneAndUpdate(
      { _id: vCase._id, status: "OWNER_CONFIRMATION_PENDING" },
      {
        $set: {
          status: "NOMINEE_CONFIRMATION_PENDING",
          nomineeTokenHash,
          nomineeResponseDeadline,
        },
        $unset: {
          ownerTokenHash: 1,
          ownerResponseDeadline: 1,
        }
      },
      { returnDocument: "after" }
    );

    if (updatedCase) {
      await logAuditEvent({
        action: "OWNER_RESPONSE_EXPIRED",
        resourceType: "VerificationCase",
        resourceId: vCase._id,
        metadata: { ownerId: vCase.ownerId }
      });

      // Send generic availability email to nominee
      try {
        const checkUrlAvailable = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-respond?token=${rawNomineeToken}&type=nominee&choice=available`;
        const checkUrlUnavailable = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-respond?token=${rawNomineeToken}&type=nominee&choice=unavailable`;

        await sendNomineeAvailabilityCheck(
          nominee.email,
          nominee.name,
          checkUrlAvailable,
          checkUrlUnavailable
        );
        updatedCase.nomineeAvailabilityEmailSentAt = new Date();
        await updatedCase.save();

        await logAuditEvent({
          action: "NOMINEE_AVAILABILITY_EMAIL_SENT",
          resourceType: "VerificationCase",
          resourceId: vCase._id,
          metadata: { nomineeId: nominee._id }
        });
      } catch (emailErr) {
        console.error("Failed to send nominee check email:", emailErr.message);
      }
    }
  }

  // B. Check Nominee Response Deadlines (Timeout escalation)
  const nomineePendingQuery = ownerId
    ? { ownerId, status: "NOMINEE_CONFIRMATION_PENDING", nomineeResponseDeadline: { $lte: new Date() } }
    : { status: "NOMINEE_CONFIRMATION_PENDING", nomineeResponseDeadline: { $lte: new Date() } };
  const nomineePendingCases = await VerificationCase.find(nomineePendingQuery);

  for (const vCase of nomineePendingCases) {
    // Atomically transition status from NOMINEE_CONFIRMATION_PENDING to ASSET_RELEASE_AUTHORIZED
    const updatedCase = await VerificationCase.findOneAndUpdate(
      { _id: vCase._id, status: "NOMINEE_CONFIRMATION_PENDING" },
      {
        $set: {
          status: "ASSET_RELEASE_AUTHORIZED",
        },
        $unset: {
          nomineeTokenHash: 1,
          nomineeResponseDeadline: 1,
        }
      },
      { returnDocument: "after" }
    );

    if (updatedCase) {
      await logAuditEvent({
        action: "NOMINEE_RESPONSE_EXPIRED",
        resourceType: "VerificationCase",
        resourceId: vCase._id,
        metadata: { nomineeId: vCase.nomineeId }
      });

      // Authorize release of assigned assets
      await authorizeAssetReleaseForCase(updatedCase);
    }
  }

  // C. Retry ASSET_RELEASE_AUTHORIZED cases (retries failed releases)
  const authorizedQuery = ownerId
    ? { ownerId, status: "ASSET_RELEASE_AUTHORIZED" }
    : { status: "ASSET_RELEASE_AUTHORIZED" };
  const authorizedCases = await VerificationCase.find(authorizedQuery);

  for (const vCase of authorizedCases) {
    await authorizeAssetReleaseForCase(vCase);
  }

  return { processed: policies.length, triggered: triggeredCount };
};

/**
 * Nominee: Discover inheritances triggered by owner inactivity.
 */
export const getAvailableInheritancesForNominee = async (nomineeUserId) => {
  const nominees = await Nominee.find({ nomineeUserId, status: "ACTIVE", emailVerified: true });
  const inheritances = [];

  for (const nominee of nominees) {
    // Find active verification case linked to the policies of this nominee
    const policies = await Policy.find({
      ownerId: nominee.ownerId,
      nomineeId: nominee._id,
    });

    for (const policy of policies) {
      const vCase = await VerificationCase.findOne({
        policyId: policy._id,
        status: { $in: [
          "OWNER_CONFIRMATION_PENDING",
          "NOMINEE_CONFIRMATION_PENDING",
          "ASSET_RELEASE_AUTHORIZED",
          "RELEASED",
          "OWNER_AVAILABLE",
          "NOMINEE_OWNER_AVAILABLE",
          // Keep old statuses for legacy data compatibility:
          "VERIFICATION_REQUIRED",
          "NOMINEE_REQUESTED",
          "ADMIN_REVIEW",
          "APPROVED"
        ]}
      });

      if (vCase) {
        // Fetch existing access requests
        const requests = await AccessRequest.find({
          verificationCaseId: vCase._id,
          nomineeId: nominee._id,
        });

        // Map assets with basic metadata and access request status
        await policy.populate("assets");
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
 * Handle Owner Availability Check response (Link callback)
 */
export const respondOwnerAvailability = async (token) => {
  const tokenHash = hashToken(token);

  // Find verification case and check it's in expected previous state
  const vCase = await VerificationCase.findOne({
    ownerTokenHash: tokenHash,
    status: "OWNER_CONFIRMATION_PENDING"
  });

  if (!vCase) {
    const checkCase = await VerificationCase.findOne({ ownerTokenHash: tokenHash });
    if (checkCase && checkCase.ownerResponseDeadline && checkCase.ownerResponseDeadline <= new Date()) {
      const err = new Error("Availability confirmation link has expired.");
      err.statusCode = 400;
      err.errorCode = "LINK_EXPIRED";
      throw err;
    }
    const err = new Error("Invalid or expired response token.");
    err.statusCode = 400;
    err.errorCode = "INVALID_TOKEN";
    throw err;
  }

  if (vCase.ownerResponseDeadline && vCase.ownerResponseDeadline <= new Date()) {
    const err = new Error("Availability confirmation link has expired.");
    err.statusCode = 400;
    err.errorCode = "LINK_EXPIRED";
    throw err;
  }

  // Atomically update state
  const updatedCase = await VerificationCase.findOneAndUpdate(
    { _id: vCase._id, status: "OWNER_CONFIRMATION_PENDING" },
    {
      $set: {
        status: "OWNER_AVAILABLE",
        completedAt: new Date()
      },
      $unset: {
        ownerTokenHash: 1,
        ownerResponseDeadline: 1,
        nomineeTokenHash: 1,
        nomineeResponseDeadline: 1
      }
    },
    { returnDocument: "after" }
  );

  if (!updatedCase) {
    const err = new Error("Transition failed. Already updated or race condition.");
    err.statusCode = 400;
    throw err;
  }

  await logAuditEvent({
    action: "OWNER_AVAILABILITY_RESPONDED",
    resourceType: "VerificationCase",
    resourceId: updatedCase._id,
    metadata: { ownerId: updatedCase.ownerId, method: "LINK", response: "AVAILABLE" }
  });

  // Try sending confirmation email
  try {
    const owner = await User.findById(updatedCase.ownerId);
    if (owner) {
      await sendOwnerAvailableConfirmation(owner.email, owner.name);
    }
  } catch (emailErr) {
    console.error("Failed to send owner confirmation email:", emailErr.message);
  }

  return {
    message: "You have confirmed that you are available. Please log in to LegacyVault to keep your account active."
  };
};

/**
 * Handle Nominee Availability Check response (Link callback)
 */
export const respondNomineeAvailability = async (token, choice) => {
  if (choice !== "available" && choice !== "unavailable") {
    const err = new Error("Invalid choice response.");
    err.statusCode = 400;
    throw err;
  }

  const tokenHash = hashToken(token);

  // Find verification case and check it's in expected previous state
  const vCase = await VerificationCase.findOne({
    nomineeTokenHash: tokenHash,
    status: "NOMINEE_CONFIRMATION_PENDING"
  });

  if (!vCase) {
    const checkCase = await VerificationCase.findOne({ nomineeTokenHash: tokenHash });
    if (checkCase && checkCase.nomineeResponseDeadline && checkCase.nomineeResponseDeadline <= new Date()) {
      const err = new Error("Response deadline has expired.");
      err.statusCode = 400;
      err.errorCode = "LINK_EXPIRED";
      throw err;
    }
    const err = new Error("Invalid or expired response token.");
    err.statusCode = 400;
    err.errorCode = "INVALID_TOKEN";
    throw err;
  }

  if (vCase.nomineeResponseDeadline && vCase.nomineeResponseDeadline <= new Date()) {
    const err = new Error("Response deadline has expired.");
    err.statusCode = 400;
    err.errorCode = "LINK_EXPIRED";
    throw err;
  }

  const policy = await Policy.findById(vCase.policyId).populate("ownerId nomineeId");
  if (!policy) {
    const err = new Error("Associated policy not found.");
    err.statusCode = 404;
    err.errorCode = "POLICY_NOT_FOUND";
    throw err;
  }

  if (choice === "available") {
    // Nominee says owner is available
    const updatedCase = await VerificationCase.findOneAndUpdate(
      { _id: vCase._id, status: "NOMINEE_CONFIRMATION_PENDING" },
      {
        $set: {
          status: "NOMINEE_OWNER_AVAILABLE",
          completedAt: new Date()
        },
        $unset: {
          ownerTokenHash: 1,
          ownerResponseDeadline: 1,
          nomineeTokenHash: 1,
          nomineeResponseDeadline: 1
        }
      },
      { returnDocument: "after" }
    );

    if (!updatedCase) {
      const err = new Error("Transition failed. Already updated or race condition.");
      err.statusCode = 400;
      throw err;
    }

    await logAuditEvent({
      action: "NOMINEE_AVAILABILITY_RESPONDED",
      resourceType: "VerificationCase",
      resourceId: updatedCase._id,
      metadata: { nomineeId: updatedCase.nomineeId, choice: "AVAILABLE" }
    });

    try {
      await sendNomineeOwnerAvailableNotification(policy.nomineeId.email, policy.nomineeId.name, policy.ownerId.name);
    } catch (emailErr) {
      console.error("Failed to send nominee notification:", emailErr.message);
    }

    return {
      message: "Response recorded. Please ask the owner to log in to LegacyVault."
    };
  } else {
    // Nominee says owner is not available
    const updatedCase = await VerificationCase.findOneAndUpdate(
      { _id: vCase._id, status: "NOMINEE_CONFIRMATION_PENDING" },
      {
        $set: {
          status: "ASSET_RELEASE_AUTHORIZED"
        },
        $unset: {
          nomineeTokenHash: 1,
          nomineeResponseDeadline: 1
        }
      },
      { returnDocument: "after" }
    );

    if (!updatedCase) {
      const err = new Error("Transition failed. Already updated or race condition.");
      err.statusCode = 400;
      throw err;
    }

    await logAuditEvent({
      action: "NOMINEE_AVAILABILITY_RESPONDED",
      resourceType: "VerificationCase",
      resourceId: updatedCase._id,
      metadata: { nomineeId: updatedCase.nomineeId, choice: "NOT_AVAILABLE" }
    });

    // Authorize assets release
    await authorizeAssetReleaseForCase(updatedCase);

    return {
      message: "Response recorded. Authorized assets are now available."
    };
  }
};

/**
 * Nominee: Retrieve decrypted asset contents. Enforces strict runtime authorization.
 */
export const releaseAssetToNominee = async (nomineeUserId, assetId) => {
  // Confirm approved or already-released AccessRequest exists
  const request = await AccessRequest.findOne({
    assetId,
    status: { $in: ["APPROVED", "RELEASED"] },
  });

  if (!request) {
    const err = new Error("Access denied. No approved request found for this asset.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  // Strict backend security checks
  const nominee = await Nominee.findOne({ _id: request.nomineeId, nomineeUserId });
  if (
    !nominee ||
    nominee.status !== "ACTIVE" ||
    nominee.emailVerified !== true ||
    nominee.ownerId.toString() !== request.ownerId.toString()
  ) {
    const err = new Error("Access denied. Nominee profile mismatched, inactive, or unauthorized.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const asset = await Asset.findById(assetId);
  if (!asset || asset.ownerId.toString() !== request.ownerId.toString()) {
    const err = new Error("Asset mismatch or corrupted policy");
    err.statusCode = 400;
    err.errorCode = "ASSET_CORRUPTED";
    throw err;
  }

  const policy = await Policy.findOne({
    ownerId: request.ownerId,
    nomineeId: request.nomineeId,
    assets: assetId,
    status: { $in: ["ACTIVE", "COMPLETED"] }
  });

  if (!policy) {
    const err = new Error("Access denied. Asset is not assigned to this nominee in the policy.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const vCase = await VerificationCase.findById(request.verificationCaseId);
  if (!vCase || !["ASSET_RELEASE_AUTHORIZED", "RELEASED"].includes(vCase.status)) {
    const err = new Error("Access denied. Workflow is not in authorized release state.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
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

  // Mark as RELEASED only on the first successful release
  if (request.status === "APPROVED") {
    request.status = "RELEASED";
    request.releasedAt = new Date();
    await request.save();

    await logAuditEvent({
      actorId: nomineeUserId,
      action: "ASSET_RELEASED",
      resourceType: "Asset",
      resourceId: asset._id,
      metadata: {
        nomineeId: request.nomineeId,
        accessRequestId: request._id,
      },
    });
  }

  return assetObj;
};

/**
 * Nominee: Download decrypted file. Enforces strict runtime authorization.
 */
export const releaseAssetFileToNominee = async (nomineeUserId, assetId) => {
  // Access check
  const request = await AccessRequest.findOne({
    assetId,
    status: { $in: ["APPROVED", "RELEASED"] },
  });

  if (!request) {
    const err = new Error("Access denied. No approved request found for this file.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  // Strict backend security checks
  const nominee = await Nominee.findOne({ _id: request.nomineeId, nomineeUserId });
  if (
    !nominee ||
    nominee.status !== "ACTIVE" ||
    nominee.emailVerified !== true ||
    nominee.ownerId.toString() !== request.ownerId.toString()
  ) {
    const err = new Error("Access denied. Nominee profile mismatched, inactive, or unauthorized.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const asset = await Asset.findById(assetId);
  if (!asset || asset.ownerId.toString() !== request.ownerId.toString()) {
    const err = new Error("Asset mismatch or corrupted policy");
    err.statusCode = 400;
    err.errorCode = "ASSET_CORRUPTED";
    throw err;
  }

  const policy = await Policy.findOne({
    ownerId: request.ownerId,
    nomineeId: request.nomineeId,
    assets: assetId,
    status: { $in: ["ACTIVE", "COMPLETED"] }
  });

  if (!policy) {
    const err = new Error("Access denied. Asset is not assigned to this nominee in the policy.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const vCase = await VerificationCase.findById(request.verificationCaseId);
  if (!vCase || !["ASSET_RELEASE_AUTHORIZED", "RELEASED"].includes(vCase.status)) {
    const err = new Error("Access denied. Workflow is not in authorized release state.");
    err.statusCode = 403;
    err.errorCode = "ACCESS_DENIED";
    throw err;
  }

  const fileData = await getDecryptedAssetFile(asset);

  await logAuditEvent({
    actorId: nomineeUserId,
    action: "ASSET_DOWNLOADED",
    resourceType: "Asset",
    resourceId: asset._id,
    metadata: {
      nomineeId: request.nomineeId,
      accessRequestId: request._id,
    },
  });

  return fileData;
};

/**
 * Reusable logic to get and decrypt an asset's file.
 */
export const getDecryptedAssetFile = async (asset) => {
  if (!asset.fileMetadata || !asset.fileMetadata.filename) {
    const err = new Error("No file associated with this asset");
    err.statusCode = 404;
    err.errorCode = "FILE_NOT_FOUND";
    throw err;
  }

  // Get encrypted file from Supabase Storage
  const encryptedBuffer = await getFile(asset.fileMetadata.filename);

  // Decrypt file in backend
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