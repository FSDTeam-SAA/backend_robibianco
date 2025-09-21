import express from "express";
import authRoutes from "../src/routes/auth.routes.js";
// import paymentRoutes from "../src/routes/payment.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import { rewardRouter } from "../src/routes/rewards.routes.js";
import reviewRouter from "../src/routes/review.routes.js";
import { dashboardRouter } from "../src/routes/dashboard.routes.js";
import { profileRouter } from "../src/routes/profile.routes.js";

const router = express.Router();

// Mounting the routes

// router.use("/payment", paymentRoutes);

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/api/v1", rewardRouter);
router.use("/api/v1", reviewRouter);
router.use("/api/v1", dashboardRouter);
router.use("/api/v1", profileRouter);

export default router;
