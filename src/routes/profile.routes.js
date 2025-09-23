import express from "express";
import { getProfile } from "../controllers/profile.controller.js";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(isAuthenticated, restrictTo("admin"));

router.get("/profile", getProfile);

export const profileRouter = router;
