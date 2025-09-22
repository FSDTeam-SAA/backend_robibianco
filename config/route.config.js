import express from "express";
import authRoutes from "../src/routes/auth.routes.js";
// import paymentRoutes from "../src/routes/payment.routes.js";
import userRoutes from "../src/routes/user.routes.js";
import { rewardRouter } from "../src/routes/rewards.routes.js";
import reviewRouter from "../src/routes/review.routes.js";
import { dashboardRouter } from "../src/routes/dashboard.routes.js";
import { profileRouter } from "../src/routes/profile.routes.js";

const router = express.Router();

// Mounting the routes without redundant '/api/v1' prefix
// The '/api/v1' prefix is already defined in app.js
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

// These routers should be mounted without any prefix here
router.use("/", rewardRouter);
router.use("/", reviewRouter);
router.use("/", dashboardRouter);
router.use("/", profileRouter);

export default router;
