import {
  createTransaction,
  getAllTransaction,
  getAllIncome,
  getAllExpense,
  getTransactionSummary,
  updateTransaction,
  deleteTransaction,
} from "../service/transaction.service.js";

export const createTransactionController = async (req, res, next) => {
  try {
    const result = await createTransaction({
      userId: req.user.id,
      type: req.body.type,
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
      transactionDate: req.body.date,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllTransactionController = async (req, res, next) => {
  try {
    const result = await getAllTransaction({ userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllIncomeController = async (req, res, next) => {
  try {
    const result = await getAllIncome({ userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllExpenseController = async (req, res, next) => {
  try {
    const result = await getAllExpense({ userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTransactionSummaryController = async (req, res, next) => {
  try {
    const result = await getTransactionSummary({ userId: req.user.id });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateTransactionController = async (req, res, next) => {
  try {
    const result = await updateTransaction({
      userId: req.user.id,
      transactionId: req.params.transactionId,
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteTransactionController = async (req, res, next) => {
  try {
    const result = await deleteTransaction({
      userId: req.user.id,
      transactionId: req.params.transactionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
