import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendResponse,
  uploadOnCloudinary,
  generateVerificationCode,
  sendPasswordResetCode,
} from "../utility/helper.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";

const generateToken = (userId, secret, expiry) => {
  return jwt.sign({ id: userId }, secret, { expiresIn: expiry });
};

// Signup with role-based logic and email verification via OTP
export const signup = catchAsync(async (req, res, next) => {
  const {
    fullName,
    phone,
    email,
    gender,
    categoryId,
    role, // Role can be "user" or "seller"
    password,
    confirmPassword,
  } = req.body;

  // Validate required fields
  if (
    !fullName ||
    !phone ||
    !gender ||
    !email ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    return next(
      new AppError(
        400,
        "Full name, phone, gender, email, password, confirm password, and role are required"
      )
    );
  }
  if (password !== confirmPassword) {
    return next(new AppError(400, "Passwords do not match"));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError(400, "Email already registered"));
  }

  // Validate role
  if (role !== "user" && role !== "seller") {
    return next(new AppError(400, "Role must be either 'user' or 'seller'"));
  }

  const userData = {
    email,
    password,
    fullName,
    phone,
    gender,
    role,
    isEmailVerified: false,
  };
  if (role === "seller") {
    if (!categoryId) {
      return next(
        new AppError(400, "Service category is required for sellers")
      );
    }
    userData.category = [categoryId];
    userData.status = "pending";
  } else {
    userData.status = "active";
  }

  let user;
  try {
    user = await User.create(userData);
  } catch (err) {
    console.error("User creation error:", err);
    return next(new AppError(500, "Error creating user", err));
  }

  user.isEmailVerified = true;
  await user.save();

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message:
      "User registered successfully. Please verify the OTP sent to your email to complete registration.",
    data: {
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, "Email and password are required"));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  if (!user.isEmailVerified) {
    return next(
      new AppError(401, "Please verify your email before logging in")
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new AppError(401, "Invalid email or password"));
  }

  const accessToken = generateToken(
    user._id,
    process.env.JWT_ACCESS_SECRET,
    process.env.ACCESS_TOKEN_EXPIRY
  );
  const refreshToken = generateToken(
    user._id,
    process.env.JWT_REFRESH_SECRET,
    process.env.REFRESH_TOKEN_EXPIRY
  );

  await User.findByIdAndUpdate(user._id, { refreshToken });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      refreshToken,
      userId: user._id,
      email: user.email,
      role: user.role,
    },
  });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError(400, "Email is required"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  const otp = generateVerificationCode().toString();

  const otpExpiry = Date.now() + 10 * 60 * 1000;

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpiry = otpExpiry;
  await user.save();

  await sendPasswordResetCode(email, otp);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent to your email",
    data: { email, otpExpiry },
  });
});

export const verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError(400, "Email and OTP are required"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  if (
    user.resetPasswordOTP !== otp &&
    user.resetPasswordOTPExpiry < Date.now()
  ) {
    return next(new AppError(400, "Invalid or expired OTP"));
  }

  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  user.isEmailVerified = true;
  await user.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully",
    data: { email },
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, newPassword, repeatNewPassword } = req.body;

  if (!email || !newPassword || !repeatNewPassword) {
    return next(
      new AppError(400, "Email, new password, and repeat password are required")
    );
  }

  if (newPassword !== repeatNewPassword) {
    return next(new AppError(400, "Passwords do not match"));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  user.password = newPassword;

  await user.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset successfully",
  });
});

export const logout = catchAsync(async (req, res, next) => {
  const userId = req.user?._id;

  await User.findByIdAndUpdate(userId, { refreshToken: null });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logout successful",
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const refreshToken = req.user.refreshToken;

  if (!refreshToken) {
    return next(new AppError(401, "Refresh token not found"));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError(401, "User not found"));
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return next(new AppError(401, "Invalid or expired refresh token"));
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    user.refreshToken = newRefreshToken;
    user.save();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Refresh token updated successfully",
      data: { accessToken, newRefreshToken },
    });
  });
});
