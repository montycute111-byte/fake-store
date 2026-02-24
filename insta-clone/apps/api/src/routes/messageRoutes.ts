import { Router } from "express";
import { asyncHandler } from "../utils/http";
import { listConversations, listMessages, markSeen, sendMessage, startConversation } from "../controllers/messageController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/conversations", requireAuth, asyncHandler(startConversation));
router.get("/conversations", requireAuth, asyncHandler(listConversations));
router.get("/conversations/:conversationId/messages", requireAuth, asyncHandler(listMessages));
router.post("/conversations/:conversationId/messages", requireAuth, asyncHandler(sendMessage));
router.post("/:messageId/seen", requireAuth, asyncHandler(markSeen));

export default router;
