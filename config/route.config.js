import express from "express";

import authRoutes from "../src/routes/auth.routes.js";
// import paymentRoutes from "../src/routes/payment.routes.js";

import userRoutes from "../src/routes/user.routes.js";

import { rewardRouter } from "./routes/rewards.routes.js";

const router = express.Router();

// Mounting the routes

// router.use("/payment", paymentRoutes);

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
app.use("/api/v1", rewardRouter);
export default router;
