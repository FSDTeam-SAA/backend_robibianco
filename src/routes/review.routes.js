import express from "express";
import {
  createReview,
  getAllReviews,
  getReviewById,
} from "../controllers/review.controller.js";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.post(
  "/service/:serviceId",
  isAuthenticated,
  upload.single("reviewImage"),
  createReview
);

// User route to submit a review
router.post("/user/reviews", isAuthenticated, createReview);

// Admin routes for review management
router.use(isAuthenticated, restrictTo("admin"));
router.get("/admin/reviews", getAllReviews);
router.get("/admin/reviews/:id", getReviewById);

export default router;
