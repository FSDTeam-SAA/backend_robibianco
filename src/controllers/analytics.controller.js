import { Review } from "../models/review.model.js";
import { Reward } from "../models/reward.model.js";
import { sendResponse } from "../utility/helper.js";
import catchAsync from "../utility/catchAsync.js";

// export const getSpinsOverTime = catchAsync(async (req, res, next) => {
//   const { period = "daily" } = req.query; // 'daily', 'weekly', 'monthly'
//   let groupByFormat, timePeriod;

//   if (period === "daily") {
//     groupByFormat = "%Y-%m-%d";
//     timePeriod = 7;
//   } else if (period === "weekly") {
//     groupByFormat = "%Y-%W";
//     timePeriod = 4;
//   } else if (period === "monthly") {
//     groupByFormat = "%Y-%m";
//     timePeriod = 12;
//   } else {
//     return next(new AppError(400, "Invalid period specified."));
//   }

//   const startDate = new Date();
//   if (period === "daily") {
//     startDate.setDate(startDate.getDate() - 7);
//   } else if (period === "weekly") {
//     startDate.setDate(startDate.getDate() - 28);
//   } else if (period === "monthly") {
//     startDate.setMonth(startDate.getMonth() - 12);
//   }

//   const spins = await Review.aggregate([
//     {
//       $match: {
//         createdAt: { $gte: startDate },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           $dateToString: {
//             format: groupByFormat,
//             date: "$createdAt",
//           },
//         },
//         count: { $sum: 1 },
//       },
//     },
//     {
//       $sort: { _id: 1 },
//     },
//   ]);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Spins data retrieved successfully.",
//     data: spins,
//   });
// });

export const getSpinsOverTime = catchAsync(async (req, res, next) => {
  const { filter = "daily" } = req.query; // 'daily' | 'weekly' | 'monthly'

  let groupBy = {};
  let projectBy = {};

  if (filter === "daily") {
    groupBy = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
      dayOfWeek: { $dayOfWeek: "$createdAt" },
    };
    projectBy = { _id: 0, dayOfWeek: "$_id.dayOfWeek", count: 1 };
  } else if (filter === "weekly") {
    groupBy = {
      year: { $year: "$createdAt" },
      week: { $week: "$createdAt" },
    };
    projectBy = { _id: 0, week: "$_id.week", year: "$_id.year", count: 1 };
  } else if (filter === "monthly") {
    groupBy = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
    projectBy = { _id: 0, month: "$_id.month", year: "$_id.year", count: 1 };
  }

  const spins = await Review.aggregate([
    { $group: { _id: groupBy, count: { $sum: 1 } } },
    { $project: projectBy },
    { $sort: { _id: 1 } },
  ]);

  // 🔹 Formatting
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let formatted = [];

  if (filter === "daily") {
    formatted = spins.map((item) => ({
      period: "daily",
      label: dayNames[item.dayOfWeek - 1], // convert number to name
      count: item.count,
    }));
  } else if (filter === "weekly") {
    formatted = spins.map((item) => ({
      period: "weekly",
      week: item.week,
      label: `Week ${item.week}, ${item.year}`,
      count: item.count,
    }));
  } else if (filter === "monthly") {
    formatted = spins.map((item) => ({
      period: "monthly",
      month: item.month,
      label: `${monthNames[item.month - 1]} ${item.year}`,
      count: item.count,
    }));
  }

  res.status(200).json({
    statusCode: 200,
    success: true,
    message: "Spins data retrieved successfully.",
    data: formatted,
  });
});

// Get review distribution - positive vs negative
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
  const filter = req.query.filter || "daily";
  const pageNumber = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.limit, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const now = new Date();
  let startDate;

  switch (filter) {
    case "daily":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - daysSinceMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const query = {
    spinResult: { $exists: true },
    rewardClaimedStatus: "pending",
    createdAt: { $gte: startDate },
  };

  const topRewards = await Review.find(query)
    .populate("spinResult", "rewardName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const total = await Review.countDocuments(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top rewards claimed retrieved successfully.",
    data: topRewards,
    meta: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
