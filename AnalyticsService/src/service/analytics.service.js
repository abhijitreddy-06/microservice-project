import axios from "axios";
import { getRedisClient } from "../config/redis.js";

const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL;
const DEBT_SERVICE_URL = process.env.DEBT_SERVICE_URL;
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

const SUMMARY_CACHE_TTL_SECONDS = 5 * 60;
const MONTHLY_CACHE_TTL_SECONDS = 10 * 60;
const DEBT_CACHE_TTL_SECONDS = 15 * 60;

const getSummaryCacheKey = (userId) => `analytics:summary:${userId}`;
const getMonthlyCacheKey = (userId) => `analytics:monthlySummary:${userId}`;
const getDebtCacheKey = (userId) => `analytics:debtSummary:${userId}`;

const readCache = async (cacheKey) => {
  try {
    const redis = await getRedisClient();
    const cachedValue = await redis.get(cacheKey);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue);
  } catch (error) {
    return null;
  }
};

const writeCache = async (cacheKey, data, ttlSeconds) => {
  try {
    const redis = await getRedisClient();
    await redis.set(cacheKey, JSON.stringify(data), {
      EX: ttlSeconds,
    });
  } catch (error) {}
};

const deleteUserCache = async (userId) => {
  const redis = await getRedisClient();
  await redis.del(
    getSummaryCacheKey(userId),
    getMonthlyCacheKey(userId),
    getDebtCacheKey(userId),
  );
};

export const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export const fetchTransactions = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  try {
    const url = `${TRANSACTION_SERVICE_URL}/transactions/getAllTransactions`;

    const res = await axios.get(url, {
      headers: {
        "x-user-id": userId,
        "x-internal-secret": INTERNAL_SERVICE_SECRET,
      },
    });

    const data = res.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    if (Array.isArray(data?.transactions)) {
      return data.transactions;
    }

    return [];
  } catch (error) {
    throw createError("Failed to fetch transactions", 500);
  }
};

export const fetchDebts = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  try {
    const url = `${DEBT_SERVICE_URL}/debt/getdebts`;

    const res = await axios.get(url, {
      headers: {
        "x-user-id": userId,
        "x-internal-secret": INTERNAL_SERVICE_SECRET,
      },
    });

    const data = res.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.debts)) {
      return data.debts;
    }

    return [];
  } catch (error) {
    throw createError("Failed to fetch debts", 500);
  }
};

export const getAnalyticsSummary = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  const cacheKey = getSummaryCacheKey(userId);
  const cachedData = await readCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const transactions = await fetchTransactions(userId);
  const debts = await fetchDebts(userId);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const transaction of transactions) {
    if (transaction.type === "income") {
      totalIncome += parseFloat(transaction.amount || 0);
    }

    if (transaction.type === "expense") {
      totalExpense += parseFloat(transaction.amount || 0);
    }
  }

  const currentBalance = totalIncome - totalExpense;

  let totalLent = 0;
  let totalBorrowed = 0;

  for (const debt of debts) {
    if (debt.lender_id === userId && debt.status === "active") {
      totalLent += parseFloat(debt.amount || 0);
    }

    if (debt.borrower_id === userId && debt.status === "active") {
      totalBorrowed += parseFloat(debt.amount || 0);
    }
  }

  const netDebtPosition = totalLent - totalBorrowed;

  const result = {
    totalIncome,
    totalExpense,
    currentBalance,
    totalLent,
    totalBorrowed,
    netDebtPosition,
  };

  await writeCache(cacheKey, result, SUMMARY_CACHE_TTL_SECONDS);

  return result;
};

export const getMonthlySummary = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  const cacheKey = getMonthlyCacheKey(userId);
  const cachedData = await readCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const transactions = await fetchTransactions(userId);

  const monthlyData = {};

  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expense: 0,
      };
    }

    if (transaction.type === "income") {
      monthlyData[monthKey].income += parseFloat(transaction.amount || 0);
    }

    if (transaction.type === "expense") {
      monthlyData[monthKey].expense += parseFloat(transaction.amount || 0);
    }
  }

  await writeCache(cacheKey, monthlyData, MONTHLY_CACHE_TTL_SECONDS);

  return monthlyData;
};

export const getDebtSummary = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  const cacheKey = getDebtCacheKey(userId);
  const cachedData = await readCache(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const debts = await fetchDebts(userId);

  let totalLent = 0;
  let totalBorrowed = 0;

  for (const debt of debts) {
    if (debt.status !== "active") continue;

    if (debt.lender_id === userId) {
      totalLent += parseFloat(debt.amount || 0);
    }

    if (debt.borrower_id === userId) {
      totalBorrowed += parseFloat(debt.amount || 0);
    }
  }

  const result = {
    totalLent,
    totalBorrowed,
    netDebtPosition: totalLent - totalBorrowed,
  };

  await writeCache(cacheKey, result, DEBT_CACHE_TTL_SECONDS);

  return result;
};

export const clearAnalyticsCache = async (userId) => {
  if (!userId) {
    throw createError("userId is required", 400);
  }

  await deleteUserCache(userId);

  return {
    success: true,
    message: "Analytics cache cleared",
  };
};
