import express from "express";
import {
  getProfile,
  updateProfile,
  allSeller,
  getRequestedSeller,
  updateRequestedSellerStatus,
  topRatedSellers,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.get("/profile", isAuthenticated, getProfile);
router.get("/top-rated-sellers", isAuthenticated, topRatedSellers);
router.patch(
  "/update-profile",
  isAuthenticated,
  upload.single("profileImage"),
  updateProfile
);

router.get("/all-seller", isAuthenticated, allSeller);
router.get("/requested-seller", isAuthenticated, getRequestedSeller);
router.patch(
  "/update-requested-seller/:id",
  isAuthenticated,
  updateRequestedSellerStatus
);

export default router;
