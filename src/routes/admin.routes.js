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
import { getAllUsers, getUserDetails } from "../controllers/user.controller.js";

const router = express.Router();


router.use(isAuthenticated, restrictTo("admin"));

router.route("/rewards").get(getAllRewards).post(createReward);

router
  .route("/rewards/:id")
  .get(getRewardById)
  .patch(updateReward)
  .delete(deleteReward);


router.route("/reviews").get(getAllReviews);

router.route("/reviews/:id").get(getReviewById).delete(deleteReview);


router.use("/analytics", analyticsRoutes);


router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);

export default router;
