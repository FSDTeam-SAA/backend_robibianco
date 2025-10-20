import catchAsync from '../utility/catchAsync.js'
import AppError from '../errors/appError.js'
import { sendResponse } from '../utility/helper.js'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { Spin } from '../models/spinResult.model.js'
import { Reward } from '../models/reward.model.js'

// Generate unique code
function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

// Create device fingerprint based on IP + User-Agent
function generateDeviceFingerprint(ipAddress, userAgent) {
  return crypto
    .createHash('sha256')
    .update(`${ipAddress}-${userAgent}`)
    .digest('hex')
}

// export const createSpin = catchAsync(async (req, res) => {
//   const { spinResult } = req.body
//   if (!spinResult) throw new AppError(400, 'Spin result is required')

//   // ✅ Get IP Address
//   const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress

//   // ✅ Get Device Info
//   const userAgent = req.headers['user-agent']
//   const deviceInfo = { userAgent }

//   // ✅ Generate fingerprint
//   const fingerprint = generateDeviceFingerprint(ipAddress, userAgent)

//   // ✅ Check spin count for this month by fingerprint
//   const startOfMonth = new Date()
//   startOfMonth.setDate(1)
//   startOfMonth.setHours(0, 0, 0, 0)

//   const endOfMonth = new Date(startOfMonth)
//   endOfMonth.setMonth(endOfMonth.getMonth() + 1)

//   const spinCount = await Spin.countDocuments({
//     fingerprint,
//     createdAt: { $gte: startOfMonth, $lt: endOfMonth },
//   })

//   if (spinCount >= 2) {
//     return sendResponse(res, {
//       statusCode: 400,
//       success: false,
//       message:
//         'You have reached your monthly limit of 2 spins from this device.',
//     })
//   }

//   // ✅ Generate unique code
//   const uniqueCode = generateUniqueCode()

//   // ✅ Generate QR code

//   // ✅ Save spin data
//   const newSpin = await Spin.create({
//     spinResult,
//     uniqueCode,
//     ipAddress,
//     deviceInfo,
//     fingerprint, // store fingerprint for future checks
//   })

//   const frontendLink = `https://yourfrontend.com/redeem/${newSpin._id}`

//   const qrCodeImage = await QRCode.toDataURL(frontendLink)

//   sendResponse(res, {
//     statusCode: 201,
//     success: true,
//     message: 'Spin saved successfully',
//     data: {
//       spin: newSpin,
//       qrCode: qrCodeImage,
//       link: frontendLink,
//     },
//   })
// })

// Get single Spin by ID

export const createSpin = catchAsync(async (req, res) => {
  const { rewardId } = req.body
  if (!rewardId) throw new AppError(400, 'Reward ID is required')

  const reward = await Reward.findById(rewardId)
  if (!reward) throw new AppError(404, 'Reward not found')

  if (!reward.isTryAgain && reward.stock <= 0) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'This reward is out of stock.',
    })
  }

  // ✅ Get IP Address
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  // ✅ Get Device Info
  const userAgent = req.headers['user-agent']
  const deviceInfo = { userAgent }

  // ✅ Generate fingerprint
  const fingerprint = generateDeviceFingerprint(ipAddress, userAgent)

  // ✅ Check spin count for this month by fingerprint
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)

  const spinCount = await Spin.countDocuments({
    fingerprint,
    createdAt: { $gte: startOfMonth, $lt: endOfMonth },
  })

  if (spinCount >= 2) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message:
        'You have reached your monthly limit of 2 spins from this device.',
    })
  }

  // ✅ Generate unique code
  const uniqueCode = generateUniqueCode()

  if (reward) {
    reward.stock -= 1
    await reward.save()
  }

  let newSpin = await Spin.create({
    spinResult: reward._id,
    uniqueCode,
    ipAddress,
    deviceInfo,
    fingerprint,
  })

  // ✅ Spin এর মধ্যে reward populate
  newSpin = await Spin.findById(newSpin._id).populate('spinResult')

  // ✅ QR Code তৈরি
  const frontendLink = `https://yourfrontend.com/redeem/${newSpin._id}`
  const qrCodeImage = await QRCode.toDataURL(frontendLink)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Spin saved successfully',
    data: {
      spin: newSpin,
      qrCode: qrCodeImage,
      link: frontendLink,
    },
  })
})


export const getSpinById = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const spin = await Spin.findById(id)
  if (!spin) {
    throw new AppError(404, 'Spin not found')
  }

  if (spin.status === 'claimed') {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'You have already claimed your reward.',
    })
  }

  // If pending, return the spin result
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Spin retrieved successfully.',
    data: spin,
  })
})

// Patch Spin status to claimed (authenticated)
export const claimSpin = catchAsync(async (req, res, next) => {
  const { id } = req.params

  const user = req.user

  if (!user) {
    throw new AppError(401, 'You are not authorized to claim this spin.')
  }

  const spin = await Spin.findById(id)
  if (!spin) {
    throw new AppError(404, 'Spin not found')
  }

  if (spin.status === 'claimed') {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Spin is already claimed.',
    })
  }

  spin.status = 'claimed'
  await spin.save()

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Spin has been claimed successfully.',
    data: spin,
  })
})
