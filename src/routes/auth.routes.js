import express from "express";
import {
  signup,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
