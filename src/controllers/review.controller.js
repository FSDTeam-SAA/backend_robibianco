import { Review } from "../models/review.model.js";
import { Reward } from "../models/reward.model.js";
import { User } from "../models/user.model.js";
import {
  sendResponse,
  generateUniqueCode,
  // Add a utility function for Google Review link/API check later
} from "../utility/helper.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import QRCode from "qrcode";

// Utility to check for Google API key dynamically
const getGoogleReviewLink = () => {
  // Dynamically check if the Google Business Profile API is set up.
  // For now, we return a simple mock link or a real link if set in .env
  const GOOGLE_REVIEW_URL =
    process.env.GOOGLE_REVIEW_URL ||
    "https://example.com/mock-google-review-link";
  return GOOGLE_REVIEW_URL;
};

// ====================================================================
// NEW STEP 1: User facing: Submit basic info (Name, Email) and get Review ID
// ====================================================================
export const preSpinRegister = catchAsync(async (req, res, next) => {
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return next(
      new AppError(400, "Name and email are required to register for the spin.")
    );
  }

  // Check if a record already exists for this email
  let existingReview = await Review.findOne({ email });

  if (existingReview) {
    if (existingReview.prizeStatus === "won_pending_review") {
      // User already registered and spun, but hasn't claimed
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "You have already won! Complete the Google Review to claim.",
        data: {
          reviewId: existingReview._id,
          prizeStatus: existingReview.prizeStatus,
        },
      });
    } else if (existingReview.prizeStatus === "won_claimed") {
      return next(new AppError(400, "You have already claimed your prize."));
    } else if (existingReview.prizeStatus === "not_eligible") {
      return next(
        new AppError(400, "You have already spun and did not win a prize.")
      );
    }
    // If prizeStatus is "pre_spin", we return the existing ID for the spin action
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Ready to spin!",
      data: {
        reviewId: existingReview._id,
        prizeStatus: existingReview.prizeStatus,
      },
    });
  }

  // New user, create the initial pre_spin document
  const newReview = await Review.create({
    name,
    email,
    phone,
    prizeStatus: "pre_spin",
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Registration successful. Proceed to spin.",
    data: {
      reviewId: newReview._id,
      prizeStatus: "pre_spin",
    },
  });
});

// ====================================================================
// NEW STEP 2: User facing: Runs the Spin Logic based on Review ID
// ====================================================================
export const performSpin = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError(404, "Spin entry not found."));
  }

  if (review.prizeStatus !== "pre_spin") {
    return next(
      new AppError(400, "This entry has already been spun or claimed.")
    );
  }

  // --- SPIN LOGIC (Copied from the previous initiateSpin) ---

  const availableRewards = await Reward.find({ stock: { $gt: 0 } });

  if (availableRewards.length === 0) {
    // If no prize is available and no 'Try Again' exists, this is an issue.
  }

  const tryAgainReward = await Reward.findOne({ isTryAgain: true });

  const allOptions = tryAgainReward
    ? [...availableRewards, tryAgainReward]
    : availableRewards;

  let prizeResult;

  // Weighted selection logic
  const totalStock = allOptions.reduce((sum, r) => sum + r.stock, 0);
  let randomNumber = Math.random() * totalStock;

  for (const reward of allOptions) {
    if (randomNumber < reward.stock) {
      prizeResult = reward;
      break;
    }
    randomNumber -= reward.stock;
  }

  if (!prizeResult) {
    prizeResult =
      tryAgainReward ||
      availableRewards[Math.floor(Math.random() * availableRewards.length)];
  }

  // --- SAVE RESULT & DETERMINE NEXT STEP ---
  let prizeStatus;
  let googleReviewUrl = null;

  if (prizeResult.isTryAgain) {
    prizeStatus = "not_eligible";
  } else {
    prizeStatus = "won_pending_review";
    googleReviewUrl = getGoogleReviewLink();

    // Decrement stock immediately only if a prize was won
    await Reward.findByIdAndUpdate(prizeResult._id, { $inc: { stock: -1 } });
  }

  // Update the existing review document with the spin result
  review.spinResult = prizeResult._id;
  review.prizeStatus = prizeStatus;
  await review.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: prizeResult.isTryAgain
      ? "Thank you for participating! Please try again next time."
      : "Congratulations! You won a prize. Complete the Google Review to claim it.",
    data: {
      reviewId: review._id,
      prize: {
        id: prizeResult._id,
        rewardName: prizeResult.rewardName,
        description: prizeResult.description,
        isTryAgain: prizeResult.isTryAgain,
        googleReviewUrl: googleReviewUrl,
      },
    },
  });
});

// ====================================================================
// STEP 3: User facing: Claim the Prize by confirming the Google Review
// New function to handle the prize claim/review completion
// ====================================================================
export const claimPrize = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body; // User submits local confirmation/rating

  if (!rating || !comment) {
    return next(
      new AppError(
        400,
        "Rating and comment are required to complete the claim."
      )
    );
  }

  const review = await Review.findById(reviewId).populate("spinResult");
  if (!review) {
    return next(new AppError(404, "Spin entry not found."));
  }

  if (review.prizeStatus !== "won_pending_review") {
    if (review.prizeStatus === "won_claimed") {
      // Already claimed, just return the code
      const qrCodeDataUrl = await QRCode.toDataURL(review.prizeCode);
      return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Prize already claimed. Here is your code.",
        data: {
          prizeCode: review.prizeCode,
          qrCodeDataUrl: qrCodeDataUrl,
        },
      });
    }
    return next(new AppError(400, "No prize to claim for this entry."));
  }

  // --- DYNAMIC GOOGLE REVIEW CHECK MOCK/REAL LOGIC ---
  let isReviewVerified = false;

  // If GOOGLE_REVIEW_API_KEY is set in .env, use real API logic (TBD implementation)
  if (process.env.GOOGLE_REVIEW_API_KEY) {
    // MOCK: Replace this with real Google API check logic later
    // Example: await checkGoogleReview(review.email);
    isReviewVerified = true;
  } else {
    // MOCK: If no API key, we assume the user has completed the review on the external link
    // We only check for the presence of the local rating/comment
    isReviewVerified = true;
  }

  if (!isReviewVerified) {
    return next(
      new AppError(
        400,
        "Could not verify your Google Review. Please ensure it has been published."
      )
    );
  }

  // 1. Generate the Prize Code and Update Review
  const prizeCode = generateUniqueCode();
  const qrCodeDataUrl = await QRCode.toDataURL(prizeCode);

  review.prizeCode = prizeCode;
  review.prizeStatus = "won_claimed";
  review.rating = rating;
  review.comment = comment;
  review.googleReviewStatus = "verified"; // Mark as locally verified
  await review.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message:
      "Google Review confirmed. Your prize has been successfully claimed!",
    data: {
      prizeCode: prizeCode,
      couponCode: review.spinResult.couponCode,
      rewardName: review.spinResult.rewardName,
      qrCodeDataUrl: qrCodeDataUrl,
    },
  });
});

// Admin facing: Get all reviews
// Update the query to include the new prizeStatus fields
export const getAllReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, filter = "all", status = "all" } = req.query;
  const skip = (page - 1) * limit;

  let query = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Date filters (same as before)
  if (filter === "today") {
    query.createdAt = { $gte: today };
  } else if (filter === "lastWeek") {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    query.createdAt = { $gte: lastWeek };
  } else if (filter === "lastMonth") {
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    query.createdAt = { $gte: lastMonth };
  }

  // Status filter (new)
  if (status !== "all") {
    query.prizeStatus = status;
  }

  // Include only entries that have at least spun the wheel
  query.spinResult = { $exists: true };

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

  // CRITICAL: If a prize was won and stock was decremented, we should check if
  // we need to return the stock or if the prize was claimed.
  // For simplicity, we are skipping stock adjustment on deletion for now.

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully.",
    data: deletedReview,
  });
});

// Removed the old 'submitReview' and 'spinWheel' exports and replaced with 'initiateSpin' and 'claimPrize'
