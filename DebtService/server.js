import "dotenv/config";
import app from "./app.js";
import sequelize from "./src/config/database.js";
import {Debt, NetBalance} from "./src/model/debt.model.js";

const PORT = process.env.PORT;

try {
  await sequelize.authenticate();
  console.log("DB connected");

  await sequelize.sync();
  console.log("Tables created");

} catch (err) {
  console.error(err);
}

app.listen(PORT, () => {
  console.log(`Debt service running on http://localhost:${PORT}`);
});
