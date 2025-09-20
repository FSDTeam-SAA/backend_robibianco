import express from "express";
import {
  createBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
  incrementBannerClicks,
  getBannerById
} from "../controllers/banner.controller.js";

import { isAuthenticated } from "./../middlewares/auth.middlewares.js";

const router = express.Router();

// CRUD
router.post("/", isAuthenticated, createBanner);
router.get("/", getAllBanners);
router.get("/:id", getBannerById);
router.patch("/:id", isAuthenticated, updateBanner);
router.delete("/:id", isAuthenticated, deleteBanner);

// Increment clicks when user clicks banner
router.patch("/:id/click", incrementBannerClicks);

export default router;
