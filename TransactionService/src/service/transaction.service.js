import Transaction from "../model/transaction.model.js";

const ANALYTICS_SERVICE_URL =
  process.env.ANALYTICS_SERVICE_URL || "http://localhost:3004";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET;

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isValidAmount = (amount) =>
  typeof amount === "number" &&
  Number.isFinite(amount) &&
  amount > 0 &&
  amount <= 1000000;

const invalidateAnalyticsCache = async (userId) => {
  if (!userId) {
    return;
  }

  try {
    await fetch(`${ANALYTICS_SERVICE_URL}/analytics/cache/${userId}`, {
      method: "DELETE",
      headers: {
        "x-user-id": String(userId),
        "x-internal-secret": INTERNAL_SERVICE_SECRET,
      },
    });
  } catch (error) {
    console.warn("Failed to invalidate analytics cache:", error.message);
  }
};

//create transaction
export const createTransaction = async ({
  userId,
  type,
  amount,
  category,
  description,
  transactionDate,
}) => {
  if (
    !userId ||
    !type ||
    amount === undefined ||
    amount === null ||
    !category ||
    !description
  ) {
    throw createError("Missing values", 400);
  }
  const lowerType = type.toLowerCase();
  if (lowerType !== "income" && lowerType !== "expense") {
    throw createError("Wrong type", 400);
  }
  if (!isValidAmount(amount)) {
    throw createError("Invalid amount", 400);
  }
  await Transaction.create({
    userId: userId,
    type: lowerType,
    amount: amount,
    category: category,
    description: description,
    transactionDate: transactionDate || new Date(),
  });

  await invalidateAnalyticsCache(userId);

  return { success: true };
};

//get all transaction for history
export const getAllTransaction = async ({ userId }) => {
  if (!userId) {
    throw createError("Missing userId", 400);
  }
  const results = await Transaction.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
  return { results };
};

//get all Income for incomes history
export const getAllIncome = async ({ userId }) => {
  if (!userId) {
    throw createError("Missing userId", 400);
  }
  const results = await Transaction.findAll({
    where: { userId: userId, type: "income" },
    order: [["createdAt", "DESC"]],
  });
  return { results };
};

//get all Expenses for Expense history
export const getAllExpense = async ({ userId }) => {
  if (!userId) {
    throw createError("Missing userId", 400);
  }
  const results = await Transaction.findAll({
    where: { userId: userId, type: "expense" },
    order: [["createdAt", "DESC"]],
  });
  return { results };
};

//get transaction summary like total income, total expense, net balance
export const getTransactionSummary = async ({ userId }) => {
  if (!userId) {
    throw createError("Missing userId", 400);
  }
  const totalIncome = await Transaction.sum("amount", {
    where: {
      userId: userId,
      type: "income",
    },
  });
  const totalExpense = await Transaction.sum("amount", {
    where: {
      userId: userId,
      type: "expense",
    },
  });
  const income = parseFloat(totalIncome || 0);
  const expense = parseFloat(totalExpense || 0);
  const netBalance = income - expense;

  return { income, expense, netBalance };
};

//update transaction within 24 hours
export const updateTransaction = async ({
  userId,
  transactionId,
  amount,
  category,
  description,
}) => {
  if (!userId || !transactionId || !description) {
    throw createError("Missing required fields", 400);
  }

  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw createError("Transaction not found", 404);
  }

  const createdAt = new Date(transaction.createdAt);
  const now = new Date();

  const diffInMs = now - createdAt;
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours > 24) {
    throw createError("Transaction can only be updated within 24 hours", 400);
  }

  if (amount !== undefined && amount !== null && !isValidAmount(amount)) {
    throw createError("Invalid amount", 400);
  }

  const [affectedRows] = await Transaction.update(
    {
      amount: amount ?? transaction.amount,
      category: category ?? transaction.category,
      description: description ?? transaction.description,
    },
    {
      where: {
        id: transactionId,
        userId,
      },
    },
  );

  if (affectedRows === 0) {
    throw createError("Transaction not found or already deleted", 404);
  }

  await invalidateAnalyticsCache(userId);

  return {
    success: true,
    message: "Transaction updated successfully",
  };
};

//delete transaction within 24hours
export const deleteTransaction = async ({ userId, transactionId }) => {
  if (!userId || !transactionId) {
    throw createError("Missing required fields", 400);
  }

  const transaction = await Transaction.findOne({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    throw createError("Transaction not found", 404);
  }

  const createdAt = new Date(transaction.createdAt);
  const now = new Date();

  const diffInMs = now - createdAt;
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours > 24) {
    throw createError("Transaction can only be deleted within 24 hours", 400);
  }

  const deletedRows = await Transaction.destroy({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (deletedRows === 0) {
    throw createError("Transaction not found or already deleted", 404);
  }

  await invalidateAnalyticsCache(userId);

  return {
    success: true,
    message: "Transaction deleted successfully",
  };
};
