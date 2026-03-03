import { NotificationType } from "@prisma/client";
import { Request, Response } from "express";
import { createCommentSchema, createPostSchema } from "../validators/post";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http";

function pagination(req: Request) {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

export async function createPost(req: Request, res: Response) {
  const body = createPostSchema.parse(req.body);
  const post = await prisma.post.create({
    data: {
      authorId: req.user!.userId,
      caption: body.caption,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType
    }
  });

  res.status(201).json(post);
}

export async function deletePost(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.userId;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, "Post not found");
  }
  if (post.authorId !== userId) {
    throw new HttpError(403, "Not allowed to delete this post");
  }

  await prisma.post.delete({ where: { id: postId } });
  res.status(204).send();
}

export async function getFeed(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { limit, skip, page } = pagination(req);

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true }
  });

  const visibleAuthors = [userId, ...following.map((f) => f.followingId)];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: visibleAuthors } },
    include: {
      author: { select: { id: true, username: true, name: true, avatarUrl: true } },
      likes: { where: { userId }, select: { id: true } },
      saves: { where: { userId }, select: { id: true } },
      _count: { select: { likes: true, comments: true } }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip
  });

  res.json({
    page,
    limit,
    data: posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdAt,
      author: post.author,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments
      },
      viewer: {
        liked: post.likes.length > 0,
        saved: post.saves.length > 0
      }
    }))
  });
}

export async function getExplore(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { limit, skip, page } = pagination(req);
  const posts = await prisma.post.findMany({
    include: {
      author: { select: { id: true, username: true, name: true, avatarUrl: true } },
      likes: { where: { userId }, select: { id: true } },
      saves: { where: { userId }, select: { id: true } },
      _count: { select: { likes: true, comments: true } }
    },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
    skip
  });

  res.json({
    page,
    limit,
    data: posts.map((post) => ({
      id: post.id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdAt,
      author: post.author,
      counts: {
        likes: post._count.likes,
        comments: post._count.comments
      },
      viewer: {
        liked: post.likes.length > 0,
        saved: post.saves.length > 0
      }
    }))
  });
}

export async function toggleLike(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return res.json({ liked: false });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, "Post not found");
  }

  await prisma.like.create({ data: { postId, userId } });
  if (post.authorId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        actorId: userId,
        type: NotificationType.LIKE,
        entityId: postId
      }
    });
  }

  res.json({ liked: true });
}

export async function toggleSave(req: Request, res: Response) {
  const { postId } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.save.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await prisma.save.delete({ where: { id: existing.id } });
    return res.json({ saved: false });
  }

  await prisma.save.create({ data: { postId, userId } });
  res.json({ saved: true });
}

export async function listComments(req: Request, res: Response) {
  const { postId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { postId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" }
  });

  res.json(comments);
}

export async function createComment(req: Request, res: Response) {
  const { postId } = req.params;
  const body = createCommentSchema.parse(req.body);
  const userId = req.user!.userId;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new HttpError(404, "Post not found");
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      body: body.body,
      parentId: body.parentId
    },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true }
      }
    }
  });

  if (post.authorId !== userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        actorId: userId,
        type: NotificationType.COMMENT,
        entityId: postId
      }
    });
  }

  res.status(201).json(comment);
}
