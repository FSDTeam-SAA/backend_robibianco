import express from "express";
import { getAllRewards } from "../controllers/reward.controller.js";

const router = express.Router();

// Public route to get all rewards for the spin wheel display.
router.get("/rewards", getAllRewards);

export default router;
