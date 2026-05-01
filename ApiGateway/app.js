import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import gatewayRoutes from "./src/routes/gateway.routes.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || " http://localhost:3005",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Gateway running",
  });
});

app.use("/api", gatewayRoutes);

app.use(errorHandler);

export default app;
