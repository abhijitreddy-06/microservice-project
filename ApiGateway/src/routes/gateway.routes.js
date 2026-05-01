import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import {
  AUTH_SERVICE_URL,
  TRANSACTION_SERVICE_URL,
  DEBT_SERVICE_URL,
  ANALYTICS_SERVICE_URL,
} from "../config/urls.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  authRateLimiter,
  apiRateLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

const applyInternalHeaders = (proxyReq, req, res) => {
  if (INTERNAL_SERVICE_SECRET) {
    proxyReq.setHeader("x-internal-secret", INTERNAL_SERVICE_SECRET);
  }

  fixRequestBody(proxyReq, req, res);
};

const createInternalProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => `${req.baseUrl}${path}`,
    onProxyReq: applyInternalHeaders,
  });

const registerProtectedService = (path, target) => {
  router.use(path, apiRateLimiter, protect, createInternalProxy(target));
};

const forwardAuthRequest = async (req, res, next) => {
  try {
    const targetUrl = `${AUTH_SERVICE_URL}${req.originalUrl.replace(/^\/api/, "")}`;
    const headers = {
      "content-type": req.headers["content-type"] || "application/json",
    };

    if (req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    }

    if (INTERNAL_SERVICE_SECRET) {
      headers["x-internal-secret"] = INTERNAL_SERVICE_SECRET;
    }

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    const responseBody = await upstreamResponse.text();
    const responseHeaders = {};

    upstreamResponse.headers.forEach((value, key) => {
      if (!["transfer-encoding", "connection", "keep-alive"].includes(key)) {
        responseHeaders[key] = value;
      }
    });

    res.status(upstreamResponse.status).set(responseHeaders).send(responseBody);
  } catch (error) {
    next(error);
  }
};

// AUTH SERVICE
router.use("/auth", authRateLimiter, forwardAuthRequest);

// TRANSACTION SERVICE
registerProtectedService("/transactions", TRANSACTION_SERVICE_URL);

// DEBT SERVICE
registerProtectedService("/debt", DEBT_SERVICE_URL);

// ANALYTICS SERVICE
registerProtectedService("/analytics", ANALYTICS_SERVICE_URL);

export default router;
