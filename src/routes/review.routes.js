import express from "express";
import {
  preSpinRegister,
  performSpin,
  claimPrize,
} from "../controllers/review.controller.js";

const router = express.Router();

// User-facing "Spin & Win" process:

// 1. POST /api/v1/spin-win/register
// Endpoint to submit Name/Email and get a reviewId (pre_spin state).
router.post("/register", preSpinRegister);

// 2. PATCH /api/v1/spin-win/spin/:reviewId
// Endpoint to trigger the spin logic using the reviewId.
router.patch("/spin/:reviewId", performSpin);

// 3. PATCH /api/v1/spin-win/claim/:reviewId
// Endpoint to claim the prize by submitting the local rating/comment.
router.patch("/claim/:reviewId", claimPrize);

export default router;
