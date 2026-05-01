const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export const protect = (req, res, next) => {
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

  const forwardedUserId = req.headers["x-user-id"];

  if (!forwardedUserId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing forwarded user context",
    });
  }

  req.user = {
    id: forwardedUserId,
  };

  next();
};
