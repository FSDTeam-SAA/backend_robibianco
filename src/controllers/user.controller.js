import { User } from "../models/user.model.js";
import { sendResponse, uploadOnCloudinary } from "../utility/helper.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { Review } from "../models/review.model.js";

// Get Profile
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

// Update Profile
export const updateProfile = catchAsync(async (req, res) => {
  const { fullName, phone, gender, dateOfBirth, address } = req.body;

  const image = req.file
    ? await uploadOnCloudinary(req.file.buffer, "profile_images")
    : undefined;

  const profileImage = image ? image.secure_url : undefined;

  const updateData = {
    fullName,
    phone,
    gender,
    dateOfBirth,
    address,
    profileImage,
  };

  // Remove undefined or null fields
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Change user password
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(400, "New password and confirm password do not match");
  }

  if (!(await User.isPasswordMatched(currentPassword, user.password))) {
    throw new AppError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: user,
  });
});

//  Admin route admin only access this
export const getRequestedSeller = catchAsync(async (req, res) => {
  const requestedSeller = await User.find({ status: "pending" }).select(
    "-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry"
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Requested seller found",
    data: requestedSeller,
  });
});

export const updateRequestedSellerStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller status updated successfully",
    data: user,
  });
});

// Get all sellers
export const allSeller = catchAsync(async (req, res) => {
  const sellers = await User.find({ role: "seller" })
    .select("-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry")
    .lean();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: sellers.length
      ? "Sellers retrieved successfully"
      : "No sellers found",
    data: {
      count: sellers.length,
      sellers,
    },
  });
});

export const topRatedSellers = catchAsync(async (req, res) => {
  const sellers = await Review.aggregate([
    // Lookup service info for each review
    {
      $lookup: {
        from: "services",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },
    { $unwind: "$service" },

    // Lookup seller info from service
    {
      $lookup: {
        from: "users",
        localField: "service.seller",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    // Only sellers with correct role
    {
      $match: {
        "seller.role": "seller",
      },
    },

    // Group reviews by seller and calculate avg rating
    {
      $group: {
        _id: "$seller._id",
        seller: { $first: "$seller" },
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },

    // Sort by avg rating, then by number of reviews
    { $sort: { averageRating: -1, totalReviews: -1 } },

    // Limit top N sellers
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    message: "Top rated sellers",
    data: sellers,
  });
});
