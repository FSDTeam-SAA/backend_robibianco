import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/category.controller.js";
import upload from "../middlewares/multer.middlewares.js";

const router = express.Router();

router.post("/create-category", upload.single("categoryImage"), createCategory);
router.get("/all-category", getAllCategories);
router.get("/get-category/:id", getCategoryById);
router.patch(
  "/update-category/:id",
  upload.single("categoryImage"),
  updateCategory
);
router.delete("/:id", deleteCategory);

export default router;
