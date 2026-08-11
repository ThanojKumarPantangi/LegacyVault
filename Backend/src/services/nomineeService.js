import { Nominee } from "../models/Nominee.js";
import { User } from "../models/User.js";

/**
 * Adds a new nominee for a user.
 */
export const addNominee = async (ownerId, { name, email, relationship }) => {
  const normalizedEmail = email.toLowerCase();

  // Check if already nominated by this user
  const existingNominee = await Nominee.findOne({ ownerId, email: normalizedEmail });
  if (existingNominee) {
    const err = new Error("You have already added a nominee with this email");
    err.statusCode = 400;
    err.errorCode = "NOMINEE_ALREADY_EXISTS";
    throw err;
  }

  // Check if a user is already registered with this email
  const registeredUser = await User.findOne({ email: normalizedEmail });
  const nomineeUserId = registeredUser ? registeredUser._id : undefined;
  const status = registeredUser ? "ACTIVE" : "PENDING";

  const nominee = new Nominee({
    ownerId,
    nomineeUserId,
    name,
    email: normalizedEmail,
    relationship,
    status,
  });

  await nominee.save();
  return nominee;
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
    const normalizedEmail = email.toLowerCase();
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

      // Update link status
      const registeredUser = await User.findOne({ email: normalizedEmail });
      nominee.nomineeUserId = registeredUser ? registeredUser._id : undefined;
      nominee.status = registeredUser ? "ACTIVE" : "PENDING";
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

  // Check policies referencing this nominee
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
