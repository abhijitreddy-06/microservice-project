import * as debtService from "../service/debt.service.js";

// POST /createdebt - Create new debt
export const createDebt = async (req, res, next) => {
  try {
    const { borrower_email, amount } = req.body;
    const lenderId = req.user.id;

    const debt = await debtService.createDebt(lenderId, borrower_email, amount);

    res.status(201).json({
      success: true,
      message: "Debt created successfully",
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

// GET /getdebts - Get all debts for user
export const getDebts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const debts = await debtService.getUserDebts(userId);

    res.status(200).json({
      success: true,
      count: debts.length,
      data: debts,
    });
  } catch (error) {
    next(error);
  }
};

// GET /netbalances - Get net balances
export const getNetBalances = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const balances = await debtService.getUserNetBalances(userId);

    res.status(200).json({
      success: true,
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /settledebt - Settle a debt (full settlement only)
export const settleDebt = async (req, res, next) => {
  try {
    const { debt_id } = req.body;
    const userId = req.user.id;

    const debt = await debtService.settleDebt(debt_id, userId);

    res.status(200).json({
      success: true,
      message: "Debt settled successfully",
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};
