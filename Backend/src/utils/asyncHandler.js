/**
 * Express middleware helper to catch asynchronous errors and forward them to error handlers.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
