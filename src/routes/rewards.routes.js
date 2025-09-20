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

// Admin routes
router.use(isAuthenticated, restrictTo("admin"));
router.route("/admin/rewards").get(getAllRewards).post(createReward);

// User routes
router.route("/user/spin").post(isAuthenticated, spinWheel);
router.route("/user/claim/:rewardId").post(isAuthenticated, claimReward);

export const rewardRouter = router;
