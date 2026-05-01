import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError("Access token missing", 401));
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return next(createError("Unauthorized", 401));
    }

    let decoded;

    try {
      decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    } catch (error) {
      return next(createError("Invalid or expired access token", 401));
    }

    req.user = {
      id: decoded.userId,
    };

    req.headers["x-user-id"] = decoded.userId;

    next();
  } catch (error) {
    next(createError("Authentication failed", 500));
  }
};