import { Router } from "express";
import { protect } from "../middleware/debt.middleware.js";
import * as debtController from "../controller/debt.controller.js";

const router = Router();

router.use(protect);

router.post("/createdebt", debtController.createDebt);
router.get("/getdebts", debtController.getDebts);
router.get("/getNetBalances", debtController.getNetBalances);
router.put("/settledebt", debtController.settleDebt);

export default router;
