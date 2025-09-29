import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // Pre-Spin Data (Initial Submission)
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // Ensure one spin per email/review entry
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // Post-Spin/Prize Data
    spinResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      default: null,
    },
    prizeCode: {
      type: String,
      default: null,
    },

    // Status tracking for the new flow
    prizeStatus: {
      type: String,
      enum: ["pre_spin", "won_pending_review", "won_claimed", "not_eligible"],
      default: "pre_spin",
    },

    // Google Review Data (Mandatory for Prize Claim, now optional on this model)
    googleReviewStatus: {
      type: String,
      enum: ["pending", "submitted", "verified"], // Used for tracking external Google Review
      default: "pending",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null, // No longer required on initial submission
    },
    comment: {
      // Renamed from 'review' to 'comment' for clarity
      type: String,
      trim: true,
      default: null, // No longer required on initial submission
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model("Review", reviewSchema);
