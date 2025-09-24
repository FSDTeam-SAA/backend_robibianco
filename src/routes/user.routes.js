import express from "express";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller.js";

const router = express.Router();

// User profile routes
router
  .route("/profile")
  .get(isAuthenticated, getProfile)
  .patch(isAuthenticated, upload.single("profileImage"), updateProfile);

router.patch("/change-password", isAuthenticated, changePassword);

export default router;
