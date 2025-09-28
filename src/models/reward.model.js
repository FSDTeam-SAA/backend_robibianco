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
      trim: true,
      sparse: true,
    
     
    },
    stockLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDays: {
      type: Number,
      required: true,
      min: 0,
    },
    isTryAgain: {
      type: Boolean,
      default: false,
    },
    requiresReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// A hook to set initial stock to stockLimit
rewardSchema.pre("save", function (next) {
  if (this.isNew) {
    this.stock = this.stockLimit;
  }
  next();
});

export const Reward = mongoose.model("Reward", rewardSchema);
