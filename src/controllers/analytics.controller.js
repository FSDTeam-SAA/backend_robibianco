import { Review } from "../models/review.model.js";
import { Reward } from "../models/reward.model.js";
import { sendResponse } from "../utility/helper.js";
import catchAsync from "../utility/catchAsync.js";

// Get spin count over time (daily, weekly, monthly)
export const getSpinsOverTime = catchAsync(async (req, res, next) => {
  const { period = "daily" } = req.query; // 'daily', 'weekly', 'monthly'
  let groupByFormat, timePeriod;

  if (period === "daily") {
    groupByFormat = "%Y-%m-%d";
    timePeriod = 7; // Last 7 days
  } else if (period === "weekly") {
    groupByFormat = "%Y-%W";
    timePeriod = 4; // Last 4 weeks
  } else if (period === "monthly") {
    groupByFormat = "%Y-%m";
    timePeriod = 12; // Last 12 months
  } else {
    return next(new AppError(400, "Invalid period specified."));
  }

  const startDate = new Date();
  if (period === "daily") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === "weekly") {
    startDate.setDate(startDate.getDate() - 28);
  } else if (period === "monthly") {
    startDate.setMonth(startDate.getMonth() - 12);
  }

  const spins = await Review.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupByFormat,
            date: "$createdAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Spins data retrieved successfully.",
    data: spins,
  });
});

// Get review distribution (positive vs negative)
export const getReviewDistribution = catchAsync(async (req, res, next) => {
  const totalReviews = await Review.countDocuments();
  const positiveReviews = await Review.countDocuments({
    rating: { $gte: 4 },
  });
  const negativeReviews = totalReviews - positiveReviews;

  const positivePercentage = (positiveReviews / totalReviews) * 100 || 0;
  const negativePercentage = (negativeReviews / totalReviews) * 100 || 0;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review distribution retrieved successfully.",
    data: {
      total: totalReviews,
      positive: positiveReviews,
      negative: negativeReviews,
      positivePercentage: positivePercentage.toFixed(2),
      negativePercentage: negativePercentage.toFixed(2),
    },
  });
});

// Get top rewards claimed
export const getTopRewardsClaimed = catchAsync(async (req, res, next) => {
  const topRewards = await Review.find({
    spinResult: { $exists: true },
    rewardClaimedStatus: "pending",
  })
    .populate("spinResult", "rewardName")
    .sort({ createdAt: -1 })
    .limit(10);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top rewards claimed retrieved successfully.",
    data: topRewards,
  });
});
