import express from "express";
import {
  createPayment,
  confirmPayment,
} from "../controllers/payment.controller.js";
const router = express.Router();

// Create Payment
router.post("/create-payment", createPayment);

// Confirm Payment
router.post("/confirm-payment", confirmPayment);

export default router;
