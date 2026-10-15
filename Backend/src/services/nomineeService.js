import crypto from "crypto";
import { Nominee } from "../models/Nominee.js";
import { User } from "../models/User.js";
import { sendNomineeVerificationEmail } from "./notificationService.js";
import { logAuditEvent } from "./auditService.js";

/**
 * Adds a new nominee for a user (starts as PENDING).
 */
export const addNominee = async (ownerId, { name, email, relationship }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already nominated by this user
  const existingNominee = await Nominee.findOne({ ownerId, email: normalizedEmail });
  if (existingNominee) {
    const err = new Error("You have already added a nominee with this email");
    err.statusCode = 400;
    err.errorCode = "NOMINEE_ALREADY_EXISTS";
    throw err;
  }

  // Generate nominee verification token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Check if a user is already registered with this email to link
  const registeredUser = await User.findOne({ email: normalizedEmail });
  const nomineeUserId = registeredUser ? registeredUser._id : undefined;

  const nominee = new Nominee({
    ownerId,
    nomineeUserId,
    name,
    email: normalizedEmail,
    relationship,
    status: "PENDING",
    emailVerified: false,
    verificationTokenHash,
    verificationTokenExpiresAt,
  });

  await nominee.save();

  await logAuditEvent({
    actorId: ownerId,
    action: "NOMINEE_VERIFICATION_SENT",
    resourceType: "Nominee",
    resourceId: nominee._id,
    metadata: { nomineeEmail: normalizedEmail }
  });

  // Send nominee email verification link
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-nominee-email?token=${rawToken}`;
  await sendNomineeVerificationEmail(normalizedEmail, name, verifyUrl);

  return nominee;
};

/**
 * Verifies nominee email address.
 */
export const verifyNomineeEmail = async (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const nominee = await Nominee.findOne({
    verificationTokenHash: tokenHash,
  });

  if (!nominee) {
    const err = new Error("Invalid or expired response token.");
    err.statusCode = 400;
    err.errorCode = "INVALID_TOKEN";
    throw err;
  }

  if (nominee.verificationTokenExpiresAt <= new Date()) {
    const err = new Error("Response deadline has expired.");
    err.statusCode = 400;
    err.errorCode = "LINK_EXPIRED";
    throw err;
  }

  if (nominee.status !== "PENDING") {
    const err = new Error("Nominee is already verified.");
    err.statusCode = 400;
    err.errorCode = "ALREADY_VERIFIED";
    throw err;
  }

  // Set Nominee active
  nominee.status = "ACTIVE";
  nominee.emailVerified = true;
  nominee.emailVerifiedAt = new Date();
  
  // Clear token fields
  nominee.verificationTokenHash = undefined;
  nominee.verificationTokenExpiresAt = undefined;

  // Re-verify User link if registered in the meantime
  const registeredUser = await User.findOne({ email: nominee.email });
  if (registeredUser) {
    nominee.nomineeUserId = registeredUser._id;
  }

  await nominee.save();

  await logAuditEvent({
    action: "NOMINEE_EMAIL_VERIFIED",
    resourceType: "Nominee",
    resourceId: nominee._id,
    metadata: { email: nominee.email }
  });

  return {
    success: true,
    message: "Email verified successfully. Nominee is now active.",
  };
};

/**
 * Retrieves all nominees for an owner.
 */
export const getNominees = async (ownerId) => {
  return await Nominee.find({ ownerId });
};

/**
 * Retrieves a single nominee by ID for an owner.
 */
export const getNomineeById = async (ownerId, nomineeId) => {
  const nominee = await Nominee.findOne({ _id: nomineeId, ownerId });
  if (!nominee) {
    const err = new Error("Nominee not found");
    err.statusCode = 404;
    err.errorCode = "NOMINEE_NOT_FOUND";
    throw err;
  }
  return nominee;
};

/**
 * Updates a nominee.
 */
export const updateNominee = async (ownerId, nomineeId, { name, email, relationship }) => {
  const nominee = await Nominee.findOne({ _id: nomineeId, ownerId });
  if (!nominee) {
    const err = new Error("Nominee not found");
    err.statusCode = 404;
    err.errorCode = "NOMINEE_NOT_FOUND";
    throw err;
  }

  if (name) nominee.name = name;
  if (relationship) nominee.relationship = relationship;

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== nominee.email) {
      // Check duplicate nomination
      const duplicate = await Nominee.findOne({ ownerId, email: normalizedEmail });
      if (duplicate) {
        const err = new Error("A nominee with this email already exists");
        err.statusCode = 400;
        err.errorCode = "NOMINEE_ALREADY_EXISTS";
        throw err;
      }
      nominee.email = normalizedEmail;

      // Reset verification state
      nominee.emailVerified = false;
      nominee.status = "PENDING";
      nominee.emailVerifiedAt = undefined;

      // Update link status
      const registeredUser = await User.findOne({ email: normalizedEmail });
      nominee.nomineeUserId = registeredUser ? registeredUser._id : undefined;

      // Generate new token and expiry
      const rawToken = crypto.randomBytes(32).toString("hex");
      nominee.verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      nominee.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await logAuditEvent({
        actorId: ownerId,
        action: "NOMINEE_VERIFICATION_SENT",
        resourceType: "Nominee",
        resourceId: nominee._id,
        metadata: { nomineeEmail: normalizedEmail }
      });

      // Send new verification email
      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-nominee-email?token=${rawToken}`;
      await sendNomineeVerificationEmail(normalizedEmail, nominee.name, verifyUrl);
    }
  }

  await nominee.save();
  return nominee;
};

/**
 * Deletes a nominee. Also checks if any Policy references them.
 */
export const deleteNominee = async (ownerId, nomineeId) => {
  const nominee = await Nominee.findOne({ _id: nomineeId, ownerId });
  if (!nominee) {
    const err = new Error("Nominee not found");
    err.statusCode = 404;
    err.errorCode = "NOMINEE_NOT_FOUND";
    throw err;
  }

  const { Policy } = await import("../models/Policy.js");
  const linkedPolicy = await Policy.findOne({ ownerId, nomineeId });
  if (linkedPolicy) {
    const err = new Error("Cannot delete nominee. They are linked to an active inheritance policy.");
    err.statusCode = 400;
    err.errorCode = "NOMINEE_LINKED_TO_POLICY";
    throw err;
  }

  await nominee.deleteOne();
  return { success: true };
};
