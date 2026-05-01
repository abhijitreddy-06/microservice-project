import * as analyticsService from "../service/analytics.service.js";

export const analyticsSummary = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const data = await analyticsService.getAnalyticsSummary(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const monthlySummary = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const data = await analyticsService.getMonthlySummary(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const debtSummary = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const data = await analyticsService.getDebtSummary(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const clearAnalyticsCache = async (req, res, next) => {
  try {
    const userId = req.params.userId || (req.user && req.user.id);
    const data = await analyticsService.clearAnalyticsCache(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export default {
  analyticsSummary,
  monthlySummary,
  debtSummary,
  clearAnalyticsCache,
};
