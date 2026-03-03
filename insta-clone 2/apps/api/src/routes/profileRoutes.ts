import { Router } from "express";
import { asyncHandler } from "../utils/http";
import { followUser, getProfile, unfollowUser, updateProfile } from "../controllers/profileController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/:username", asyncHandler(getProfile));
router.patch("/me", requireAuth, asyncHandler(updateProfile));
router.post("/:userId/follow", requireAuth, asyncHandler(followUser));
router.delete("/:userId/follow", requireAuth, asyncHandler(unfollowUser));

export default router;
