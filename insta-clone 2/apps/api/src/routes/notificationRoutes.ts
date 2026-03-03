import { Router } from "express";
import { asyncHandler } from "../utils/http";
import { listNotifications, markNotificationRead } from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, asyncHandler(listNotifications));
router.post("/:notificationId/read", requireAuth, asyncHandler(markNotificationRead));

export default router;
