import mongoose from 'mongoose'

const spinSchema = new mongoose.Schema(
  {
    spinResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward', 
      required: true,
    },
    uniqueCode: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
    },
    deviceInfo: {
      type: Object,
    },
    fingerprint: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'claimed'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

export const Spin = mongoose.model('Spin', spinSchema)
