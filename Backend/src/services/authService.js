import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * Registers a new user.
 * @returns {object} { user, token }
 */
export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("User already exists with this email address");
    err.statusCode = 400;
    err.errorCode = "USER_ALREADY_EXISTS";
    throw err;
  }

  // Create user. If it is the first user in database, we can make it an ADMIN for development convenience.
  const usersCount = await User.countDocuments();
  const assignedRole = role || (usersCount === 0 ? "ADMIN" : "USER");

  const user = new User({
    name,
    email,
    password, // Encrypted by pre-save hook
    role: assignedRole,
  });

  await user.save();

  // Link any nominee entries referencing this email address
  try {
    const { Nominee } = await import("../models/Nominee.js");
    await Nominee.updateMany(
      { email: email.toLowerCase() },
      { nomineeUserId: user._id, status: "ACTIVE" }
    );
  } catch (linkError) {
    console.error("Nominee link error:", linkError.message);
  }

  // Convert to object and delete password
  const userObject = user.toObject();
  delete userObject.password;

  const token = generateToken(user);

  return { user: userObject, token };
};

/**
 * Log in a user.
 * @returns {object} { user, token }
 */
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    err.errorCode = "INVALID_CREDENTIALS";
    throw err;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    err.errorCode = "INVALID_CREDENTIALS";
    throw err;
  }

  // Update activity on login
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
        policyId: { $in: policyIds },
        status: { $in: ["OWNER_CONFIRMATION_PENDING", "NOMINEE_CONFIRMATION_PENDING"] }
      });

      for (const vCase of activeCases) {
        const updatedCase = await VerificationCase.findOneAndUpdate(
          { _id: vCase._id, status: vCase.status },
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
