import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
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
    },
    phone: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    spinResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      default: null, // The spin result is null until the user spins
    },
    prizeCode: {
      type: String,
      default: null, // The prize code is null until the user spins and wins
    },
    rewardClaimedStatus: {
      type: String,
      enum: ["pending", "claimed", "not_eligible"], // not_eligible for "Try Again" prizes
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model("Review", reviewSchema);
