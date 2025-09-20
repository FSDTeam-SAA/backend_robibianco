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
      required: true,
      trim: true,
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    //The total number of times this reward can be given out.
    stockLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    //virtual field to track the remaining stock
    // we will track this via a separate model (ClaimedReward)
    stockAvailable: {
      type: Number,
      default: 0,
    },
    expiryDays: {
      type: Number,
      required: true,
      min: 0,
    },
    // A boolean flag based on the admin form.
    requireReview: {
      type: Boolean,
      default: false,
    },
    // To track the probability of this reward being picked
    probability: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

rewardSchema.pre("save", function (next) {
  if (this.isNew) {
    this.stockAvailable = this.stockLimit;
  }
  next();
});

export const Reward = mongoose.model("Reward", rewardSchema);
