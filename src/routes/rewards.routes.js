import express from "express";
import {
  createReward,
  getAllRewards,
  spinWheel,
  claimReward,
} from "../controllers/reward.controller.js";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";

const router = express.Router();

// Admin routes - require authentication and admin role
router
  .route("/admin/rewards")
  .get(isAuthenticated, restrictTo("admin"), getAllRewards)
  .post(isAuthenticated, restrictTo("admin"), createReward);

router.route("/user/spin").post(spinWheel);
router.route("/user/claim/:rewardId").post(claimReward);

export const rewardRouter = router;
