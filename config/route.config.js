import express from "express";
import userRoutes from "../src/routes/user.routes.js";
import authRoutes from "../src/routes/auth.routes.js";
import reviewRoutes from "../src/routes/review.routes.js";
import adminRoutes from "../src/routes/admin.routes.js";
import analyticsRoutes from "../src/routes/analytics.routes.js";

const router = express.Router();

// Authentication and user-related routes
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

// User-facing "Spin & Win" review and prize routes
router.use("/spin-win", reviewRoutes);

// Admin-facing routes, protected by authentication and authorization
router.use("/admin", adminRoutes);

// Analytics routes
router.use("/analytics", analyticsRoutes);

export default router;
