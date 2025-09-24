import express from "express";
import {
  getSpinsOverTime,
  getReviewDistribution,
  getTopRewardsClaimed,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/spins-over-time", getSpinsOverTime);
router.get("/review-distribution", getReviewDistribution);
router.get("/top-rewards-claimed", getTopRewardsClaimed);

export default router;
