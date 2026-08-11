import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";

  console.error(`[ERROR] ${req.method} ${req.url} - ${statusCode} - ${err.message}`);
  if (statusCode === 500 && env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
    errorCode,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
