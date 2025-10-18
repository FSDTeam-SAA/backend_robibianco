import catchAsync from '../utility/catchAsync.js'
import AppError from '../errors/appError.js'
import { sendResponse } from '../utility/helper.js'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { Spin } from '../models/spinResult.model.js';

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

export const createSpin = catchAsync(async (req, res) => {
  const { spinResult } = req.body
  if (!spinResult) throw new AppError(400, 'Spin result is required')

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

  // ✅ Generate QR code
  const frontendLink = `https://yourfrontend.com/redeem/${uniqueCode}`
  const qrCodeImage = await QRCode.toDataURL(frontendLink)

  // ✅ Save spin data
  const newSpin = await Spin.create({
    spinResult,
    uniqueCode,
    ipAddress,
    deviceInfo,
    fingerprint, // store fingerprint for future checks
  })

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
