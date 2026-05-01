import dotenv from "dotenv";
dotenv.config();

const { default: app } = await import("./app.js");

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});