import express from "express";
import {
  createChat,
  deleteMessage,
  getChatForSeller,
  getChatForUser,
  getSingleChat,
  sendMessage,
  updateMessage,
} from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/create-chat", isAuthenticated, createChat);
router.post("/send-message", isAuthenticated, sendMessage);
router.put("/update", isAuthenticated, updateMessage);
router.delete("/remove", isAuthenticated, deleteMessage);
router.get("/get-chat", isAuthenticated, getChatForUser);
router.get("/get-single-chat/:chatId", isAuthenticated, getSingleChat);
router.get("/get-chat-seller", isAuthenticated, getChatForSeller);

export default router;
