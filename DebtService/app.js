import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import debtRoutes from "./src/route/debt.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Auth service is running" });
});

app.use("/debt", debtRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

export default app;
