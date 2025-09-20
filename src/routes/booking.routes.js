// routes/booking.routes.ts
import express from "express";
import {
  bookService,
  getMyBookings,
  getSellerBookings,
  updateBookingStatus,
} from "../controllers/booking.controller.js";

import { isAuthenticated } from "./../middlewares/auth.middlewares.js";

const router = express.Router();

// Customer books a service
router.post("/", isAuthenticated, bookService);

// Customer sees their bookings
router.get("/my", isAuthenticated, getMyBookings);

// Seller sees bookings for their services
router.get("/seller", isAuthenticated, getSellerBookings);

// Seller or Admin updates booking status
router.patch("/:id/status", isAuthenticated, updateBookingStatus);

export default router;
