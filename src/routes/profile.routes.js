import express from "express";
import { getProfile, logout } from "../controllers/profile.controller.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// All profile-related routes require authentication
router.use(isAuthenticated);

router.get("/profile", getProfile);
router.post("/logout", logout);

export const profileRouter = router;
