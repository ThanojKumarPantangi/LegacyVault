import { Policy } from "../models/Policy.js";
import { Nominee } from "../models/Nominee.js";
import { Asset } from "../models/Asset.js";

/**
 * Validates nominee and assets belong to the owner.
 */
const validatePolicyRelations = async (ownerId, nomineeId, assets) => {
  if (nomineeId) {
    const nominee = await Nominee.findOne({ _id: nomineeId, ownerId });
    if (!nominee) {
      const err = new Error("Invalid nominee. Nominee must be registered by you.");
      err.statusCode = 400;
      err.errorCode = "INVALID_NOMINEE";
      throw err;
    }
  }

  if (assets && assets.length > 0) {
    const assetsCount = await Asset.countDocuments({
      _id: { $in: assets },
      ownerId,
    });
    if (assetsCount !== assets.length) {
      const err = new Error("One or more assets are invalid or do not belong to you.");
      err.statusCode = 400;
      err.errorCode = "INVALID_ASSETS";
      throw err;
    }
  }
};

/**
 * Creates an inheritance policy.
 */
export const createPolicy = async (ownerId, { nomineeId, inactivityDays, ownerResponseDays, nomineeResponseDays, assets, adminApprovalRequired }) => {
  await validatePolicyRelations(ownerId, nomineeId, assets);

  // Check if a policy for this nominee already exists
  const existingPolicy = await Policy.findOne({ ownerId, nomineeId });
  if (existingPolicy) {
    const err = new Error("A policy already exists for this nominee. Update the existing policy instead.");
    err.statusCode = 400;
    err.errorCode = "POLICY_ALREADY_EXISTS";
    throw err;
  }

  // Enforce timeline validations
  const finalOwnerResponseDays = Number(ownerResponseDays) >= 1 ? Number(ownerResponseDays) : 3;
  const finalNomineeResponseDays = Number(nomineeResponseDays) >= 1 ? Number(nomineeResponseDays) : 7;

  const policy = new Policy({
    ownerId,
    nomineeId,
    inactivityDays: Number(inactivityDays),
    ownerResponseDays: finalOwnerResponseDays,
    nomineeResponseDays: finalNomineeResponseDays,
    assets: assets || [],
    adminApprovalRequired: adminApprovalRequired !== false,
    triggerType: "INACTIVITY",
    status: "ACTIVE",
  });

  await policy.save();
  return policy;
};

/**
 * Retrieves all policies for an owner.
 */
export const getPolicies = async (ownerId) => {
  return await Policy.find({ ownerId }).populate("nomineeId").populate("assets");
};

/**
 * Retrieves a single policy by ID.
 */
export const getPolicyById = async (ownerId, policyId) => {
  const policy = await Policy.findOne({ _id: policyId, ownerId })
    .populate("nomineeId")
    .populate("assets");

  if (!policy) {
    const err = new Error("Policy not found");
    err.statusCode = 404;
    err.errorCode = "POLICY_NOT_FOUND";
    throw err;
  }
  return policy;
};

/**
 * Updates a policy.
 */
export const updatePolicy = async (
  ownerId,
  policyId,
  { nomineeId, inactivityDays, ownerResponseDays, nomineeResponseDays, assets, adminApprovalRequired, status }
) => {
  const policy = await Policy.findOne({ _id: policyId, ownerId });
  if (!policy) {
    const err = new Error("Policy not found");
    err.statusCode = 404;
    err.errorCode = "POLICY_NOT_FOUND";
    throw err;
  }

  await validatePolicyRelations(ownerId, nomineeId, assets);

  if (nomineeId) policy.nomineeId = nomineeId;
  if (inactivityDays) policy.inactivityDays = Number(inactivityDays);
  if (ownerResponseDays !== undefined) policy.ownerResponseDays = Number(ownerResponseDays) >= 1 ? Number(ownerResponseDays) : 3;
  if (nomineeResponseDays !== undefined) policy.nomineeResponseDays = Number(nomineeResponseDays) >= 1 ? Number(nomineeResponseDays) : 7;
  if (assets) policy.assets = assets;
  if (adminApprovalRequired !== undefined) policy.adminApprovalRequired = adminApprovalRequired;
  if (status) policy.status = status;

  await policy.save();
  return policy;
};

/**
 * Deletes a policy.
 */
export const deletePolicy = async (ownerId, policyId) => {
  const policy = await Policy.findOne({ _id: policyId, ownerId });
  if (!policy) {
    const err = new Error("Policy not found");
    err.statusCode = 404;
    err.errorCode = "POLICY_NOT_FOUND";
    throw err;
  }

  await policy.deleteOne();
  return { success: true };
};
