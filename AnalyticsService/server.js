import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./src/config/redis.js";

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectRedis();
    console.log("✅ Redis connected");

    app.listen(PORT, () => {
      console.log(`Analytics service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    process.exit(1);
  }
};

startServer();