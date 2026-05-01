import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No access token",
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
  req.user = {
    id: decoded.userId,
  };

  next();
};

export const protectInternal = (req, res, next) => {
  if (!INTERNAL_SERVICE_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server misconfiguration: missing internal service secret",
    });
  }

  const requestSecret = req.headers["x-internal-secret"];

  if (requestSecret !== INTERNAL_SERVICE_SECRET) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: invalid internal service credentials",
    });
  }

  next();
};
