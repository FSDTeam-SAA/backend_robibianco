import { User } from "../models/user.model.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { sendResponse } from "../utility/helper.js";

export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry"
  );

  if (!user) {
    throw new AppError(404, "User not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

export const logout = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Clear the refresh token from the database to invalidate future sessions
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});
