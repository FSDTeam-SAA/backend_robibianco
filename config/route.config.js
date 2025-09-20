import express from "express";

import authRoutes from "../src/routes/auth.routes.js";
// import paymentRoutes from "../src/routes/payment.routes.js";

import userRoutes from "../src/routes/user.routes.js";


const router = express.Router();

// Mounting the routes

// router.use("/payment", paymentRoutes);

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
export default router;
