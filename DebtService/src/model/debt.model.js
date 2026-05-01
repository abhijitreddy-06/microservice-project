import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Debt = sequelize.define(
  "Debt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    borrower_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "settled"),
      defaultValue: "active",
    },
    settled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  },
);

export const NetBalance = sequelize.define(
  "NetBalance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_a_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_b_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    net_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  },
);
