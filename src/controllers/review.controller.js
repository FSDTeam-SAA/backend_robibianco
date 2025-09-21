import { Review } from "../models/review.model.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { sendResponse } from "../utility/helper.js";

// User: Create a new review
export const createReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id;

  // Check if user has already submitted a review
  const existingReview = await Review.findOne({ user: userId });
  if (existingReview) {
    throw new AppError(400, "You have already submitted a review.");
  }

  const newReview = await Review.create({
    user: userId,
    rating,
    comment,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review submitted successfully!",
    data: newReview,
  });
});

// Admin: Get all reviews
export const getAllReviews = catchAsync(async (req, res) => {
  const { filter, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = {};

  if (filter === "today") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: startOfToday };
  } else if (filter === "last_week") {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: lastWeek };
  } else if (filter === "last_month") {
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: lastMonth };
  }

  const totalReviews = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate("user", "fullName email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: {
      total: totalReviews,
      page: parseInt(page),
      limit: parseInt(limit),
      reviews,
    },
  });
});

// Admin: Get a single review by ID
export const getReviewById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id).populate("user", "fullName email");

  if (!review) {
    throw new AppError(404, "Review not found");
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review retrieved successfully",
    data: review,
  });
});
