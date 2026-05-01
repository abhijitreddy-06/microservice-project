import express from "express";
import {
  signup,
  login,
  refreshToken,
  logout,
  getUserByEmail,
} from "../controller/auth.controller.js";
import { protectInternal } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/user/email/:email", protectInternal, getUserByEmail);

export default router;
