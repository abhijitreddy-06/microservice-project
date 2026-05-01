import * as authService from "../service/auth.service.js";

const accessCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "Strict",
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: result.message || "User created successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const tokens = await authService.login(req.body);

    res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: "Login successful",
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.cookies.refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: "Token refreshed",
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    if (err?.statusCode === 401) {
      res.clearCookie("refreshToken");
    }
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out",
    });
  } catch (err) {
    next(err);
  }
};

export const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await authService.getUserByEmail(email);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
