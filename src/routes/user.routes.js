// user.routes.js
import express from "express";
import {
  allSeller,
  getRequestedSeller,
  updateRequestedSellerStatus,
  topRatedSellers,
} from "../controllers/user.controller.js";
import {
  isAuthenticated,
  restrictTo,
} from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(isAuthenticated, restrictTo("admin"));

router.get("/top-rated-sellers", topRatedSellers);
router.get("/all-seller", allSeller);
router.get("/requested-seller", getRequestedSeller);
router.patch("/update-requested-seller/:id", updateRequestedSellerStatus);

export default router;
