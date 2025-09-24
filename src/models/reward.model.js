import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    rewardName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    couponCode: {
      type: String,
      required: function () {
        return !this.isTryAgain;
      },
      trim: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: function () {
        return !this.isTryAgain;
      },
      min: 0,
    },
    expiry: {
      type: Date,
      required: function () {
        return !this.isTryAgain;
      },
    },
    requiresReview: {
      type: Boolean,
      default: false,
    },
    isTryAgain: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Reward = mongoose.model("Reward", rewardSchema);
