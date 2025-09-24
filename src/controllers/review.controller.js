import { Review } from "../models/review.model.js";
import { Reward } from "../models/reward.model.js";
import { User } from "../models/user.model.js";
import { sendResponse, generateUniqueCode } from "../utility/helper.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";

// User facing: Submit a review and get a spin result
export const submitReview = catchAsync(async (req, res, next) => {
  const { fullName, email, phone, review, rating } = req.body;

  if (!fullName || !email || !phone || !review || !rating) {
    return next(
      new AppError(400, "Name, email, phone, review, and rating are required.")
    );
  }

  const newReview = await Review.create({
    name: fullName,
    email,
    phone,
    rating,
    comment: review,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message:
      "Review submitted successfully. Please spin the wheel for your prize.",
    data: {
      reviewId: newReview._id,
    },
  });
});

// User facing: Spin the wheel to get a prize
export const spinWheel = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError(404, "Review not found."));
  }

  // Find all available rewards (those with stock > 0)
  const availableRewards = await Reward.find({ stock: { $gt: 0 } });

  if (availableRewards.length === 0) {
    return next(
      new AppError(
        404,
        "No rewards are currently available. Please try again later."
      )
    );
  }

  // Find the "Try Again" reward if it exists
  const tryAgainReward = await Reward.findOne({ isTryAgain: true });

  const allOptions = tryAgainReward
    ? [...availableRewards, tryAgainReward]
    : availableRewards;

  let prizeResult;

  const totalStock = allOptions.reduce((sum, r) => sum + r.stock, 0);
  let randomNumber = Math.random() * totalStock;

  for (const reward of allOptions) {
    if (randomNumber < reward.stock) {
      prizeResult = reward;
      break;
    }
    randomNumber -= reward.stock;
  }

  // Fallback in case the weighted logic fails
  if (!prizeResult) {
    prizeResult =
      availableRewards[Math.floor(Math.random() * availableRewards.length)];
  }

  let prizeCode = prizeResult.isTryAgain ? null : generateUniqueCode();
  let rewardClaimedStatus = prizeResult.isTryAgain ? "not_eligible" : "pending";

  review.spinResult = prizeResult._id;
  review.prizeCode = prizeCode;
  review.rewardClaimedStatus = rewardClaimedStatus;
  await review.save();

  if (!prizeResult.isTryAgain) {
    await Reward.findByIdAndUpdate(prizeResult._id, { $inc: { stock: -1 } });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Spin completed successfully.",
    data: {
      prize: {
        id: prizeResult._id,
        rewardName: prizeResult.rewardName,
        couponCode: prizeResult.couponCode,
        description: prizeResult.description,
        isTryAgain: prizeResult.isTryAgain,
        prizeCode: prizeCode,
      },
    },
  });
});

// Admin facing: Get all reviews with pagination and filters
export const getAllReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, filter = "all" } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    query = { createdAt: { $gte: today } };
  } else if (filter === "lastWeek") {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    query = { createdAt: { $gte: lastWeek } };
  } else if (filter === "lastMonth") {
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    query = { createdAt: { $gte: lastMonth } };
  }

  const reviews = await Review.find(query)
    .populate("spinResult", "rewardName description couponCode")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalReviews = await Review.countDocuments(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully.",
    data: {
      reviews,
      page: parseInt(page),
      limit: parseInt(limit),
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
    },
  });
});

// Admin facing: Get a single review by ID
export const getReviewById = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate(
    "spinResult",
    "rewardName description couponCode"
  );
  if (!review) {
    return next(new AppError(404, "Review not found."));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review retrieved successfully.",
    data: review,
  });
});

// Admin facing: Delete a review by ID
export const deleteReview = catchAsync(async (req, res, next) => {
  const deletedReview = await Review.findByIdAndDelete(req.params.id);
  if (!deletedReview) {
    return next(new AppError(404, "Review not found."));
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully.",
    data: deletedReview,
  });
});
