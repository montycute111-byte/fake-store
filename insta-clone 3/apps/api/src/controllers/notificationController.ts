import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function listNotifications(req: Request, res: Response) {
  const userId = req.user!.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json(notifications);
}

export async function markNotificationRead(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { notificationId } = req.params;

  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });

  res.json({ updated: notification.count });
}
