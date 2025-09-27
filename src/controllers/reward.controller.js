import { Reward } from "../models/reward.model.js";
import { ClaimedReward } from "../models/claimedReward.model.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { sendResponse } from "../utility/helper.js";
import { Review } from "../models/review.model.js";

// Admin: Create a new reward
export const createReward = catchAsync(async (req, res) => {
  const {
    rewardName,
    description,
    couponCode,
    stockLimit,
    expiryDays,
    requireReview,
  } = req.body;

  const newReward = await Reward.create({
    rewardName,
    description,
    couponCode,
    stockLimit,
    expiryDays,
    requireReview,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Reward created successfully",
    data: newReward,
  });
});

// Admin: Get all rewards
export const getAllRewards = catchAsync(async (req, res) => {
  const rewards = await Reward.find().sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rewards retrieved successfully",
    data: rewards,
  });
});

// User: Spin the wheel and claim a reward
export const spinWheel = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Check if the user has already spun and has an active, unclaimed reward
  const existingClaim = await ClaimedReward.findOne({
    user: userId,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (existingClaim) {
    throw new AppError(
      400,
      "You already have an active coupon. Please use it before spinning again."
    );
  }

  // Get available rewards (stock > 0 and probability > 0)
  const availableRewards = await Reward.find({ stockAvailable: { $gt: 0 } });

  // Calculate total probability for weighted random selection
  let totalProbability = availableRewards.reduce(
    (sum, reward) => sum + (reward.probability || 0),
    0
  );

  // If no rewards are available, user gets "Try Again"
  if (availableRewards.length === 0 || totalProbability === 0) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Spin result",
      data: {
        reward: null,
        message:
          "Sorry, all rewards are currently unavailable. Please try again later.",
      },
    });
  }

  // Weighted random selection based on probability
  const randomNumber = Math.random() * totalProbability;
  let accumulatedProbability = 0;
  let winningReward = null;

  for (const reward of availableRewards) {
    accumulatedProbability += reward.probability || 0;
    if (randomNumber <= accumulatedProbability) {
      winningReward = reward;
      break;
    }
  }

  // If no winning reward is selected (e.g., due to rounding or missing probability), default to a "Try Again" message
  if (!winningReward) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Spin result",
      data: {
        reward: null,
        message: "Sorry, please try again.",
      },
    });
  }

  // Decrease stock of the winning reward
  winningReward.stockAvailable -= 1;
  await winningReward.save();

  // Create a new claimed reward record
  const claimedReward = await ClaimedReward.create({
    user: userId,
    reward: winningReward._id,
    couponCode: winningReward.couponCode,
    expiresAt: new Date(
      Date.now() + winningReward.expiryDays * 24 * 60 * 60 * 1000
    ),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Congratulations! You have won a reward.",
    data: {
      reward: {
        name: winningReward.rewardName,
        description: winningReward.description,
        couponCode: winningReward.couponCode,
        expiresAt: claimedReward.expiresAt,
        requireReview: winningReward.requireReview,
      },
    },
  });
});

// User: Claim a reward (with review check if required)
export const claimReward = catchAsync(async (req, res) => {
  const { rewardId } = req.params;
  const userId = req.user._id;

  const claimedReward = await ClaimedReward.findOne({
    reward: rewardId,
    user: userId,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).populate("reward");

  if (!claimedReward) {
    throw new AppError(404, "Reward not found or already claimed/expired.");
  }

  // Check for review if required
  if (claimedReward.reward.requireReview) {
    const userReview = await Review.findOne({
      user: userId,
    });
    if (!userReview) {
      throw new AppError(403, "A review is required to claim this reward.");
    }
  }

  // Mark the reward as used
  claimedReward.isUsed = true;
  await claimedReward.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reward claimed successfully!",
    data: {
      couponCode: claimedReward.couponCode,
    },
  });
});
