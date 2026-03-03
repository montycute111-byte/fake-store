import { Router } from "express";
import { asyncHandler } from "../utils/http";
import {
  createComment,
  createPost,
  deletePost,
  getExplore,
  getFeed,
  listComments,
  toggleLike,
  toggleSave
} from "../controllers/postController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/feed", requireAuth, asyncHandler(getFeed));
router.get("/explore", requireAuth, asyncHandler(getExplore));
router.post("/", requireAuth, asyncHandler(createPost));
router.delete("/:postId", requireAuth, asyncHandler(deletePost));
router.post("/:postId/likes", requireAuth, asyncHandler(toggleLike));
router.post("/:postId/saves", requireAuth, asyncHandler(toggleSave));
router.get("/:postId/comments", requireAuth, asyncHandler(listComments));
router.post("/:postId/comments", requireAuth, asyncHandler(createComment));

export default router;
