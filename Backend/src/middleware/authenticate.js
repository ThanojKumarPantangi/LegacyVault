import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

/**
 * Middleware to authenticate requests via JWT.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = "";

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      const err = new Error("Not authenticated. Token is missing.");
      err.statusCode = 401;
      err.errorCode = "NOT_AUTHENTICATED";
      return next(err);
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (tokenErr) {
      const err = new Error("Not authenticated. Token is invalid or expired.");
      err.statusCode = 401;
      err.errorCode = "INVALID_TOKEN";
      return next(err);
    }

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      const err = new Error("User associated with this token no longer exists.");
      err.statusCode = 401;
      err.errorCode = "USER_NOT_FOUND";
      return next(err);
    }

    // Update lastActiveAt if more than 1 minute has passed since the last update
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (user.lastActiveAt < oneMinuteAgo) {
      user.lastActiveAt = new Date();
      // Use fire-and-forget save or await it. Let's await it to keep it reliable.
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
