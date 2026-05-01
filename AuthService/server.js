import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import sequelize from "./src/config/database.js";
import "./src/model/auth.model.js";

const PORT = process.env.PORT || 5000;

try {
  await sequelize.authenticate();
  console.log("DB connected");

  await sequelize.sync();
  console.log("Tables created");

} catch (err) {
  console.error(err);
}

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`);
});