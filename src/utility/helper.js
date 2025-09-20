import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
// import { ioHandler } from "../app.js";
import nodemailer from "nodemailer";
// import { Notification } from "./../models/notification.model.js";
dotenv.config();

let codeCounter = 202000;
export const generateUniqueCode = async () => {
  const code = codeCounter++;
  const existingProduct = await Product.findOne({ uniqueCode: code });
  if (existingProduct) {
    return generateUniqueCode();
  }
  return code;
};

export const calculateDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateAmount = (weight, distance) => {
  const ratePerKg = 5;
  const ratePerKm = 1;
  return parseFloat((weight * ratePerKg + distance * ratePerKm).toFixed(2));
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendResponse = (res, { statusCode, success, message, data }) => {
  res.status(statusCode).json({
    statusCode,
    success,
    message,
    data,
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verification Code",
    text: `Your verification code is: ${code}`,
  };
  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Code",
    text: `Your password reset code is: ${code}`,
  };
  await transporter.sendMail(mailOptions);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...options },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// export const createNotification = async (userId, message, type) => {
//   try {
//     const notification = await Notification.create({
//       userId,
//       message,
//       type,
//     });

//     ioHandler.to(`user_${userId}`).emit("newNotification", notification);

//     return notification;
//   } catch (error) {
//     console.error("Error creating notification:", error);
//     return null;
//   }
// };

// export const markAsRead = async (notificationId, userId) => {
//   return await Notification.findOneAndUpdate(
//     { _id: notificationId, userId },
//     { isRead: true },
//     { new: true }
//   );
// };
