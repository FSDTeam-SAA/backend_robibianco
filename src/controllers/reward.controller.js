import { Reward } from "../models/reward.model.js";
import { sendResponse } from "../utility/helper.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";

// Admin only: Create a new reward
export const createReward = catchAsync(async (req, res, next) => {
  const {
    rewardName,
    description,
    couponCode,
    stockLimit,
    expiryDays,
    isTryAgain,
  } = req.body;

  if (!rewardName || !stockLimit || !expiryDays || !description) {
    return next(
      new AppError(
        400,
        "Reward name, stock, expiry, and description are required."
      )
    );
  } // Handle coupon code requirement based on `isTryAgain`

  if (!isTryAgain && !couponCode) {
    return next(new AppError(400, "Coupon code is required for prizes."));
  }

  const newReward = await Reward.create({
    rewardName,
    couponCode,
    stock: stockLimit,
    expiry: expiryDays,
    description,
    isTryAgain: isTryAgain || false,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Reward created successfully.",
    data: newReward,
  });
});

// Admin only: Get all rewards with pagination
export const getAllRewards = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const rewards = await Reward.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  const totalRewards = await Reward.countDocuments();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rewards retrieved successfully.",
    data: {
      rewards,
      page,
      limit,
      totalRewards,
      totalPages: Math.ceil(totalRewards / limit),
    },
  });
});

// Admin only: Get a single reward by ID
export const getRewardById = catchAsync(async (req, res, next) => {
  const reward = await Reward.findById(req.params.id);
  if (!reward) {
    return next(new AppError(404, "Reward not found."));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reward retrieved successfully.",
    data: reward,
  });
});

// Admin only: Update a reward by ID
export const updateReward = catchAsync(async (req, res, next) => {
  const {
    rewardName,
    couponCode,
    stockLimit,
    expiryDays,
    description,
    isTryAgain,
  } = req.body;
  const updateData = {
    rewardName,
    couponCode,
    stock: stockLimit,
    expiry: expiryDays,
    description,
    isTryAgain,
  };

  const updatedReward = await Reward.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedReward) {
    return next(new AppError(404, "Reward not found."));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reward updated successfully.",
    data: updatedReward,
  });
});

// Admin only: Delete a reward by ID
export const deleteReward = catchAsync(async (req, res, next) => {
  const deletedReward = await Reward.findByIdAndDelete(req.params.id);

  if (!deletedReward) {
    return next(new AppError(404, "Reward not found."));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reward deleted successfully.",
    data: deletedReward,
  });
});
