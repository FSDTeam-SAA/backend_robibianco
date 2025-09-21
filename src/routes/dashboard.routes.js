import express from "express";
import {
  getDashboardAnalytics,
  getAllUsers,
  getUserDetails,
} from "../controllers/dashboard.controller.js";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(isAuthenticated, restrictTo("admin"));
router.get("/dashboard", getDashboardAnalytics);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);

export const dashboardRouter = router;
