import express from "express";
import { submitReview, spinWheel } from "../controllers/review.controller.js";

const router = express.Router();

// User-facing "Spin & Win" review and prize routes
router.post("/submit-review", submitReview);
router.patch("/spin-wheel/:reviewId", spinWheel);

export default router;
