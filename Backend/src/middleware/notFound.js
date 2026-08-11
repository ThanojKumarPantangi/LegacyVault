export const notFound = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  err.errorCode = "ROUTE_NOT_FOUND";
  next(err);
};
