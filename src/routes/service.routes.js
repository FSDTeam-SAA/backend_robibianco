import express from "express";

import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.post(
  "/create-service",
  isAuthenticated,
  upload.single("image"),
  createService
);
router.get("/all-services", getAllServices);
router.get("/get-service/:id", getServiceById);
router.patch(
  "/update-service/:id",
  isAuthenticated,
  upload.single("image"),
  updateService
);
router.delete("/delete-service/:id", isAuthenticated, deleteService);

export default router;
