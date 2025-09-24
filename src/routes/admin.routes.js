import express from "express";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";
import {
  createReward,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
} from "../controllers/reward.controller.js";
import {
  getAllReviews,
  getReviewById,
  deleteReview,
} from "../controllers/review.controller.js";
import analyticsRoutes from "./analytics.routes.js";
import { getAllUsers, getUserDetails } from "../controllers/user.controller.js"; // Import user management functions

const router = express.Router();

// All admin routes are protected and require the 'admin' role
router.use(isAuthenticated, restrictTo("admin"));

// Reward Management Routes
router.route("/rewards").get(getAllRewards).post(createReward);

router
  .route("/rewards/:id")
  .get(getRewardById)
  .patch(updateReward)
  .delete(deleteReward);

// Review Management Routes
router.route("/reviews").get(getAllReviews);

router.route("/reviews/:id").get(getReviewById).delete(deleteReview);

// Analytics routes are now nested under the /admin path
router.use("/analytics", analyticsRoutes);

// User Management Routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);

export default router;
