import { Debt, NetBalance } from "../model/debt.model.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;
const ANALYTICS_SERVICE_URL =
  process.env.ANALYTICS_SERVICE_URL || "http://localhost:3004";
const MAX_AMOUNT = 1000000;

// HELPER FUNCTIONS
const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getUserByEmail = async (email) => {
  try {
    const { data } = await axios.get(
      `${AUTH_SERVICE_URL}/auth/user/email/${email}`,
      {
        headers: {
          "x-internal-secret": INTERNAL_SERVICE_SECRET,
        },
      },
    );
    return data.data;
  } catch (error) {
    return null;
  }
};

const invalidateAnalyticsCache = async (userId) => {
  if (!userId) {
    return;
  }

  try {
    await axios.delete(`${ANALYTICS_SERVICE_URL}/analytics/cache/${userId}`, {
      headers: {
        "x-user-id": String(userId),
        "x-internal-secret": INTERNAL_SERVICE_SECRET,
      },
    });
  } catch (error) {
    console.warn("Failed to invalidate analytics cache:", error.message);
  }
};

const validateCreateDebt = async (lenderId, borrowerEmail, amount) => {
  if (!borrowerEmail) {
    throw createError("Borrower email is required", 400);
  }

  if (!amount) {
    throw createError("Amount is required", 400);
  }

  if (amount <= 0) {
    throw createError("Amount must be greater than 0", 400);
  }

  if (amount > MAX_AMOUNT) {
    throw createError(`Amount cannot exceed ₹${MAX_AMOUNT}`, 400);
  }

  const borrower = await getUserByEmail(borrowerEmail);
  if (!borrower) {
    throw createError("Borrower not found", 404);
  }

  if (lenderId === borrower.id) {
    throw createError("You cannot lend money to yourself", 400);
  }

  return borrower.id;
};

const validateSettlement = async (debtId, userId) => {
  if (!debtId) {
    throw createError("Debt ID is required", 400);
  }

  const debt = await Debt.findByPk(debtId);

  if (!debt) {
    throw createError("Debt not found", 404);
  }

  if (debt.status === "settled") {
    throw createError("Debt already settled", 400);
  }

  if (debt.lender_id !== userId && debt.borrower_id !== userId) {
    throw createError("Unauthorized: You don't own this debt", 403);
  }

  return debt;
};

// MAIN ENDPOINTS
export const createDebt = async (lenderId, borrowerEmail, amount) => {
  const borrowerId = await validateCreateDebt(lenderId, borrowerEmail, amount);

  const transaction = await sequelize.transaction();

  try {
    const debt = await Debt.create(
      {
        lender_id: lenderId,
        borrower_id: borrowerId,
        amount: amount,
        status: "active",
      },
      { transaction },
    );

    const [balance] = await NetBalance.findOrCreate({
      where: {
        user_a_id: lenderId,
        user_b_id: borrowerId,
      },
      defaults: {
        user_a_id: lenderId,
        user_b_id: borrowerId,
        net_amount: 0,
      },
      transaction,
    });

    balance.net_amount = parseFloat(balance.net_amount) + parseFloat(amount);
    await balance.save({ transaction });

    await transaction.commit();

    await invalidateAnalyticsCache(lenderId);
    await invalidateAnalyticsCache(borrowerId);

    return debt;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const getUserDebts = async (userId) => {
  const debts = await Debt.findAll({
    where: {
      [Op.or]: [{ lender_id: userId }, { borrower_id: userId }],
    },
    order: [["createdAt", "DESC"]],
  });

  return debts;
};

export const getUserNetBalances = async (userId) => {
  const balances = await NetBalance.findAll({
    where: {
      [Op.or]: [{ user_a_id: userId }, { user_b_id: userId }],
    },
  });

  return balances.map((b) => ({
    user_a_id: b.user_a_id,
    user_b_id: b.user_b_id,
    net_amount: parseFloat(b.net_amount),
  }));
};

export const settleDebt = async (debtId, userId) => {
  const debt = await validateSettlement(debtId, userId);

  const transaction = await sequelize.transaction();

  try {
    debt.status = "settled";
    debt.settled_at = new Date();
    await debt.save({ transaction });

    const balance = await NetBalance.findOne({
      where: {
        user_a_id: debt.lender_id,
        user_b_id: debt.borrower_id,
      },
      transaction,
    });

    if (balance) {
      balance.net_amount =
        parseFloat(balance.net_amount) - parseFloat(debt.amount);
      await balance.save({ transaction });
    }

    await transaction.commit();

    await invalidateAnalyticsCache(debt.lender_id);
    await invalidateAnalyticsCache(debt.borrower_id);

    return debt;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
