import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Generates a JSON Web Token for the user.
 * @param {object} user - User object containing _id and role
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environmental variables");
  }
  return jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
