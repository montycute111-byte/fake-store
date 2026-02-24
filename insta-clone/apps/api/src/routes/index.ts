import { Router } from "express";
import authRoutes from "./authRoutes";
import profileRoutes from "./profileRoutes";
import postRoutes from "./postRoutes";
import messageRoutes from "./messageRoutes";
import notificationRoutes from "./notificationRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/posts", postRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);

export default router;
