export const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    message = "Duplicate field value";
  }
  
  res.status(statusCode).json({
    success: false,
    message,
  });
};