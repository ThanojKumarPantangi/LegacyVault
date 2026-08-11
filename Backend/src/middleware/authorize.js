/**
 * Middleware to restrict route access by role(s).
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      err.errorCode = "NOT_AUTHENTICATED";
      return next(err);
    }

    if (!roles.includes(req.user.role)) {
      const err = new Error("Access denied. Unauthorized role permissions.");
      err.statusCode = 403;
      err.errorCode = "FORBIDDEN";
      return next(err);
    }

    next();
  };
};
