import { NotificationType } from "@prisma/client";
import { Request, Response } from "express";
import { updateProfileSchema } from "../validators/profile";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http";

export async function getProfile(req: Request, res: Response) {
  const { username } = req.params;
  const viewerId = req.user?.userId;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      petName: true,
      petBio: true,
      petAvatarUrl: true,
      isPrivate: true,
      _count: { select: { followers: true, following: true, posts: true } }
    }
  });

  if (!user) {
    throw new HttpError(404, "Profile not found");
  }

  const isFollowing = viewerId
    ? Boolean(
        await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } }
        })
      )
    : false;

  res.json({ ...user, isFollowing });
}

export async function updateProfile(req: Request, res: Response) {
  const body = updateProfileSchema.parse(req.body);
  const userId = req.user!.userId;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: body,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      bio: true,
      avatarUrl: true,
      petName: true,
      petBio: true,
      petAvatarUrl: true,
      isPrivate: true
    }
  });

  res.json(updated);
}

export async function followUser(req: Request, res: Response) {
  const viewerId = req.user!.userId;
  const { userId } = req.params;

  if (viewerId === userId) {
    throw new HttpError(400, "You cannot follow yourself");
  }

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    update: {},
    create: { followerId: viewerId, followingId: userId }
  });

  await prisma.notification.create({
    data: {
      userId,
      actorId: viewerId,
      type: NotificationType.FOLLOW,
      entityId: viewerId
    }
  });

  res.status(204).send();
}

export async function unfollowUser(req: Request, res: Response) {
  const viewerId = req.user!.userId;
  const { userId } = req.params;

  await prisma.follow.deleteMany({ where: { followerId: viewerId, followingId: userId } });
  res.status(204).send();
}
