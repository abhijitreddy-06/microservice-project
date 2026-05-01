import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    tls: REDIS_URL.startsWith("rediss://"),
  },
});

let connectPromise;

redisClient.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export const connectRedis = async () => {
  if (redisClient.isOpen) {
    return redisClient;
  }

  if (!connectPromise) {
    connectPromise = redisClient.connect().catch((error) => {
      connectPromise = null; // reset properly
      throw error;
    });
  }

  await connectPromise;
  return redisClient;
};

export const getRedisClient = async () => {
  return connectRedis();
};
