import express from "express";
import {
  createReview,
  getReviewsForService,
} from "../controllers/review.controller.js";
import { isAuthenticated } from "./../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.post(
  "/service/:serviceId",
  isAuthenticated,
  upload.single("reviewImage"),
  createReview
);

router.get("/service/:serviceId", isAuthenticated, getReviewsForService);

export default router;
