import mongoose from 'mongoose'

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
    // New Field: The actual code user receives upon claiming (e.g., "GET10OFF")
    couponCode: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    // The probability/weight is usually derived from the stock, but we keep this for structure
    weight: {
      type: Number,
      default: 1,
    },
    expiryDays: {
      type: Number,
      default: 30, // Reward expires in 30 days unless specified otherwise
    },
    // Flag to denote the "Try Again" slice, which does not count as a win/prize
    isTryAgain: {
      type: Boolean,
      default: false,
    },
    // Optional: Price/value of the reward for analytics
    value: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const Reward = mongoose.model('Reward', rewardSchema)
