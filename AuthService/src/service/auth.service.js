import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../model/auth.model.js";

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const createError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

const hashToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

export const register = async ({ email, password, firstName, lastName }) => {
  // Validation: Check required fields
  if (!email || !password || !firstName || !lastName) {
    throw createError("All fields are required", 400);
  }

  // Validation: Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError("Invalid email format", 400);
  }

  // Validation: Password length
  if (password.length < 6) {
    throw createError("Password must be at least 6 characters", 400);
  }

  // Validation: Name length
  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    throw createError("First and last names must be at least 2 characters", 400);
  }

  // Check if user already exists
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw createError("User with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  try {
    await User.create({
      email: email.toLowerCase(),
      name: fullName,
      password: passwordHash,
    });
  } catch (err) {
    // Handle database constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
      throw createError("User with this email already exists", 409);
    }
    throw createError("Failed to create user. Please try again.", 500);
  }

  return { success: true, message: "User created successfully" };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw createError("Invalid credentials", 401);
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  const hashedToken = await hashToken(refreshToken);

  await User.update({ refreshToken: hashedToken }, { where: { id: user.id } });

  return { accessToken, refreshToken };
};

export const getUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw createError("User not found", 404);
  }

  return { id: user.id, email: user.email, name: user.name };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw createError("Unauthorized", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw createError("Invalid or expired refresh token", 401);
  }

  const user = await User.findByPk(decoded.userId);

  if (!user || !user.refreshToken) {
    throw createError("Unauthorized", 401);
  }

  const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

  if (!isMatch) {
    await User.update({ refreshToken: null }, { where: { id: user.id } });

    throw createError("Session compromised. Please login again.", 401);
  }

  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  const newHashed = await hashToken(newRefreshToken);

  await User.update({ refreshToken: newHashed }, { where: { id: user.id } });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (user) {
        await User.update({ refreshToken: null }, { where: { id: user.id } });
      }
    } catch (err) {}
  }
};

export const getMe = async (req) => {
  return req.user;
};
