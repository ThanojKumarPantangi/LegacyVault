import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { PendingSignup } from "../models/PendingSignup.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { generateToken } from "../utils/generateToken.js";
import {
  sendSignupVerificationEmail,
  sendPasswordResetEmail,
} from "./notificationService.js";
import { logAuditEvent } from "./auditService.js";

/**
 * Registers a new user (Initiates PendingSignup flow).
 */
export const registerUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if verified User already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.emailVerified !== false) {
      const err = new Error("User already exists with this email address");
      err.statusCode = 400;
      err.errorCode = "USER_ALREADY_EXISTS";
      throw err;
    } else {
      // Delete legacy unverified user to clean database and start clean
      await User.deleteOne({ _id: existingUser._id });
    }
  }

  // Generate secure token and expiry
  const rawToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  let pending = await PendingSignup.findOne({ email: normalizedEmail });
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (pending) {
    // Re-use signup details, update token and expiry
    pending.name = name;
    pending.passwordHash = passwordHash;
    pending.verificationTokenHash = verificationTokenHash;
    pending.verificationTokenExpiresAt = verificationTokenExpiresAt;
    await pending.save();
  } else {
    pending = new PendingSignup({
      name,
      email: normalizedEmail,
      passwordHash,
      verificationTokenHash,
      verificationTokenExpiresAt,
    });
    await pending.save();
  }

  // Send verification email
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
  await sendSignupVerificationEmail(normalizedEmail, name, verifyUrl);

  await logAuditEvent({
    action: "USER_SIGNUP_VERIFICATION_SENT",
    resourceType: "PendingSignup",
    resourceId: pending._id,
    metadata: { email: normalizedEmail }
  });

  return {
    success: true,
    message: "Verification email sent. Please verify your email to create your account.",
  };
};

/**
 * Verifies the user email using signup token and creates the final User account.
 */
export const verifyUserEmail = async (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const pending = await PendingSignup.findOne({
    verificationTokenHash: tokenHash,
  });

  if (!pending) {
    const err = new Error("Already verified or invalid link");
    err.statusCode = 400;
    err.errorCode = "INVALID_TOKEN";
    throw err;
  }

  if (pending.verificationTokenExpiresAt <= new Date()) {
    const err = new Error("Verification link has expired.");
    err.statusCode = 400;
    err.errorCode = "LINK_EXPIRED";
    throw err;
  }

  // Create User
  const usersCount = await User.countDocuments();
  const assignedRole = usersCount === 0 ? "ADMIN" : "USER";

  const user = new User({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash, // pre-saved hash
    role: assignedRole,
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  await user.save();

  await logAuditEvent({
    actorId: user._id,
    action: "USER_EMAIL_VERIFIED",
    resourceType: "User",
    resourceId: user._id,
    metadata: { email: user.email }
  });

  // Clean up pending signup
  await PendingSignup.deleteOne({ _id: pending._id });

  // Link nominee records referencing this email address
  try {
    const { Nominee } = await import("../models/Nominee.js");
    await Nominee.updateMany(
      { email: pending.email },
      { nomineeUserId: user._id }
    );
  } catch (linkError) {
    console.error("Nominee link error:", linkError.message);
  }

  return {
    success: true,
    message: "Email verified successfully. You can now log in.",
  };
};

/**
 * Log in a user.
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check verified User
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (user) {
    // If user exists but is unverified (legacy)
    if (user.emailVerified === false) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        const err = new Error("Invalid email or password");
        err.statusCode = 401;
        err.errorCode = "INVALID_CREDENTIALS";
        throw err;
      }

      // Generate verification token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Recreate PendingSignup
      await PendingSignup.findOneAndDelete({ email: normalizedEmail });
      const pending = new PendingSignup({
        name: user.name,
        email: normalizedEmail,
        passwordHash: user.password,
        verificationTokenHash,
        verificationTokenExpiresAt,
      });
      await pending.save();

      // Delete the unverified legacy user
      await User.deleteOne({ _id: user._id });

      const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
      await sendSignupVerificationEmail(normalizedEmail, user.name, verifyUrl);

      const err = new Error("Your account is not verified. A new verification email has been sent.");
      err.statusCode = 400;
      err.errorCode = "EMAIL_NOT_VERIFIED";
      throw err;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      err.errorCode = "INVALID_CREDENTIALS";
      throw err;
    }

    user.lastActiveAt = new Date();
    await user.save();

    // Cancel active verification cases for this owner upon successful login
    try {
      const { Policy } = await import("../models/Policy.js");
      const { VerificationCase } = await import("../models/VerificationCase.js");
      const { logAuditEvent } = await import("./auditService.js");

      const ownerPolicies = await Policy.find({ ownerId: user._id });
      const policyIds = ownerPolicies.map(p => p._id);

      if (policyIds.length > 0) {
        const activeCases = await VerificationCase.find({
          ownerId: user._id,
          policyId: { $in: policyIds },
          status: { $in: ["OWNER_CONFIRMATION_PENDING", "NOMINEE_CONFIRMATION_PENDING"] }
        });

        for (const vCase of activeCases) {
          const updatedCase = await VerificationCase.findOneAndUpdate(
            { _id: vCase._id, ownerId: user._id, status: vCase.status },
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

          if (updatedCase) {
            await logAuditEvent({
              actorId: user._id,
              action: "OWNER_AVAILABILITY_RESPONDED",
              resourceType: "VerificationCase",
              resourceId: vCase._id,
              metadata: { ownerId: user._id, method: "LOGIN", response: "AVAILABLE" }
            });
          }
        }
      }
    } catch (err) {
      console.error("[LOGIN CANCEL EXCEPTION]:", err.message);
    }

    const userObject = user.toObject();
    delete userObject.password;
    const token = generateToken(user);
    return { user: userObject, token };
  }

  // 2. User doesn't exist, check PendingSignup
  const pending = await PendingSignup.findOne({ email: normalizedEmail });
  if (pending) {
    const isMatch = await bcrypt.compare(password, pending.passwordHash);
    if (!isMatch) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      err.errorCode = "INVALID_CREDENTIALS";
      throw err;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    pending.verificationTokenHash = verificationTokenHash;
    pending.verificationTokenExpiresAt = verificationTokenExpiresAt;
    await pending.save();

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
    await sendSignupVerificationEmail(normalizedEmail, pending.name, verifyUrl);

    const err = new Error("Your account is not verified. A new verification email has been sent.");
    err.statusCode = 400;
    err.errorCode = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  const err = new Error("Invalid email or password");
  err.statusCode = 401;
  err.errorCode = "INVALID_CREDENTIALS";
  throw err;
};

/**
 * Resends user verification email.
 */
export const resendVerification = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  let pending = await PendingSignup.findOne({ email: normalizedEmail });
  let user = null;

  if (!pending) {
    user = await User.findOne({ email: normalizedEmail });
  }

  const handleSend = async (name, passwordHash, isLegacyUser) => {
    // Cooldown check (60 seconds)
    const lastSent = pending ? pending.updatedAt : (user ? user.updatedAt : null);
    if (lastSent && Date.now() - new Date(lastSent).getTime() < 60 * 1000) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (pending) {
      pending.verificationTokenHash = verificationTokenHash;
      pending.verificationTokenExpiresAt = verificationTokenExpiresAt;
      await pending.save();
    } else if (isLegacyUser && user) {
      await PendingSignup.findOneAndDelete({ email: normalizedEmail });
      const newPending = new PendingSignup({
        name: user.name,
        email: normalizedEmail,
        passwordHash: user.password,
        verificationTokenHash,
        verificationTokenExpiresAt,
      });
      await newPending.save();
      await User.deleteOne({ _id: user._id });
    }

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
    await sendSignupVerificationEmail(normalizedEmail, name, verifyUrl);
  };

  if (pending) {
    await handleSend(pending.name, pending.passwordHash, false);
  } else if (user && user.emailVerified === false) {
    await handleSend(user.name, user.password, true);
  }

  return {
    success: true,
    message: "If the email is unverified, a verification email has been sent.",
  };
};

/**
 * Requests a password reset link.
 */
export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (user && user.emailVerified !== false) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await PasswordResetToken.deleteMany({ userId: user._id });

    const resetToken = new PasswordResetToken({
      userId: user._id,
      tokenHash,
      expiresAt,
    });
    await resetToken.save();

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(normalizedEmail, user.name, resetUrl);
  }

  return {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };
};

/**
 * Resets user password using a token.
 */
export const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: { $exists: false },
  });

  if (!resetToken) {
    const err = new Error("Invalid or expired reset token.");
    err.statusCode = 400;
    err.errorCode = "INVALID_TOKEN";
    throw err;
  }

  if (resetToken.expiresAt <= new Date()) {
    const err = new Error("Reset link has expired.");
    err.statusCode = 400;
    err.errorCode = "LINK_EXPIRED";
    throw err;
  }

  const user = await User.findById(resetToken.userId);
  if (!user) {
    const err = new Error("User associated with token not found.");
    err.statusCode = 404;
    err.errorCode = "USER_NOT_FOUND";
    throw err;
  }

  if (newPassword.length < 6) {
    const err = new Error("Password must be at least 6 characters long.");
    err.statusCode = 400;
    err.errorCode = "INVALID_PASSWORD";
    throw err;
  }

  user.password = newPassword;
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await PasswordResetToken.deleteMany({ userId: user._id });

  return {
    success: true,
    message: "Password reset successfully. You can now log in with your new password.",
  };
};

/**
 * Retrieve user profile by id.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User profile not found");
    err.statusCode = 404;
    err.errorCode = "USER_NOT_FOUND";
    throw err;
  }
  return user;
};
