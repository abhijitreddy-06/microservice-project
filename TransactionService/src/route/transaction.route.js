import { Router } from "express";
import { protect } from "../middleware/transaction.middleware.js";
import {
  createTransactionController,
  getAllTransactionController,
  getAllIncomeController,
  getAllExpenseController,
  getTransactionSummaryController,
  updateTransactionController,
  deleteTransactionController,
} from "../controller/transaction.controller.js";

const router = Router();

router.use(protect);

router.post("/createTransaction", createTransactionController);
router.get("/getAllTransactions", getAllTransactionController);
router.get("/getAllIncome", getAllIncomeController);
router.get("/getAllExpense", getAllExpenseController);
router.get("/getTransactionSummary", getTransactionSummaryController);
router.patch("/updateTransaction/:transactionId", updateTransactionController);
router.delete("/deleteTransaction/:transactionId", deleteTransactionController);

export default router;
