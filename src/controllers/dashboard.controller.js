import { Review } from "../models/review.model.js";
import { ClaimedReward } from "../models/claimedReward.model.js";
import { User } from "../models/user.model.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { sendResponse } from "../utility/helper.js";

export const getDashboardAnalytics = catchAsync(async (req, res) => {
  const reviewDistribution = await Review.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        positiveReviews: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
        negativeReviews: { $sum: { $cond: [{ $lte: ["$rating", 3] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        positivePercentage: {
          $multiply: [{ $divide: ["$positiveReviews", "$totalReviews"] }, 100],
        },
        negativePercentage: {
          $multiply: [{ $divide: ["$negativeReviews", "$totalReviews"] }, 100],
        },
      },
    },
  ]);

  const spinsOverTime = await ClaimedReward.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$claimedAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topRewardsClaimed = await ClaimedReward.find()
    .sort({ claimedAt: -1 })
    .limit(10)
    .populate("user", "fullName email phone")
    .populate("reward", "rewardName description");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard analytics retrieved successfully",
    data: {
      reviewDistribution: reviewDistribution[0] || {
        positivePercentage: 0,
        negativePercentage: 0,
      },
      spinsOverTime,
      topRewardsClaimed,
    },
  });
});

export const getAllUsers = catchAsync(async (req, res) => {
  const { filter, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = { role: "user" };

  let dateQuery = {};
  if (filter === "recent") {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    dateQuery = { createdAt: { $gte: lastWeek } };
  } else if (filter === "last_week_user") {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    dateQuery = { createdAt: { $gte: lastWeek } };
  } else if (filter === "last_month_user") {
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    dateQuery = { createdAt: { $gte: lastMonth } };
  }

  const finalQuery = { ...query, ...dateQuery };

  const totalUsers = await User.countDocuments(finalQuery);
  const users = await User.find(finalQuery)
    .select("-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry")
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const userWithSpinsAndRewards = await Promise.all(
    users.map(async (user) => {
      // ... same logic for claimed rewards and last active
      const claimedRewards = await ClaimedReward.find({ user: user._id })
        .populate("reward", "rewardName")
        .sort({ claimedAt: -1 })
        .lean();

      const spinCount = claimedRewards.length;
      const rewardsCount = claimedRewards.filter(
        (cr) => cr.reward !== null
      ).length;

      const lastActive =
        claimedRewards.length > 0
          ? claimedRewards[0].claimedAt
          : user.createdAt;

      return {
        ...user,
        spinsTimes: spinCount,
        rewardsCount: rewardsCount,
        lastActive,
      };
    })
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: {
      total: totalUsers,
      page: parseInt(page),
      limit: parseInt(limit),
      users: userWithSpinsAndRewards,
    },
  });
});

export const getUserDetails = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select(
    "-password -refreshToken -resetPasswordOTP -resetPasswordOTPExpiry"
  );
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const claimedRewards = await ClaimedReward.find({ user: id })
    .populate("reward", "rewardName")
    .sort({ claimedAt: -1 });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User details retrieved successfully",
    data: {
      user,
      claimedRewards: claimedRewards.map((cr) => ({
        rewardName: cr.reward ? cr.reward.rewardName : "Reward Not Found",
        date: cr.claimedAt,
        status: cr.isUsed ? "Redeemed" : "Pending",
      })),
    },
  });
});
