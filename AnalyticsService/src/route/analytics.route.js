import express from "express";
import { protect } from "../middleware/analytics.middleware.js";
import {
  analyticsSummary,
  monthlySummary,
  debtSummary,
  clearAnalyticsCache,
} from "../controller/analytics.controller.js";

const router = express.Router();

router.use(protect);

router.get("/summary", analyticsSummary);
router.get("/analyticsSummary", analyticsSummary);
router.get("/monthlySummary", monthlySummary);
router.get("/debtSummary", debtSummary);
router.delete("/cache/:userId", clearAnalyticsCache);

export default router;
