import { NotificationType } from "@prisma/client";
import { Request, Response } from "express";
import { createMessageSchema, startConversationSchema } from "../validators/message";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http";

export async function startConversation(req: Request, res: Response) {
  const body = startConversationSchema.parse(req.body);
  const userId = req.user!.userId;

  if (body.participantId === userId) {
    throw new HttpError(400, "Cannot start conversation with yourself");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { users: { some: { userId } } },
        { users: { some: { userId: body.participantId } } }
      ]
    },
    include: {
      users: {
        include: { user: { select: { id: true, username: true, name: true, avatarUrl: true } } }
      }
    }
  });

  if (existing) {
    return res.json(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      users: {
        create: [{ userId }, { userId: body.participantId }]
      }
    },
    include: {
      users: {
        include: { user: { select: { id: true, username: true, name: true, avatarUrl: true } } }
      }
    }
  });

  res.status(201).json(conversation);
}

export async function listConversations(req: Request, res: Response) {
  const userId = req.user!.userId;

  const conversations = await prisma.conversation.findMany({
    where: { users: { some: { userId } } },
    include: {
      users: {
        include: { user: { select: { id: true, username: true, name: true, avatarUrl: true } } }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  res.json(conversations);
}

export async function listMessages(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { conversationId } = req.params;

  const member = await prisma.conversationUser.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  if (!member) {
    throw new HttpError(403, "Not a participant in this conversation");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" }
  });

  res.json(messages);
}

export async function sendMessage(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { conversationId } = req.params;
  const body = createMessageSchema.parse(req.body);

  const participants = await prisma.conversationUser.findMany({ where: { conversationId } });
  if (!participants.some((p) => p.userId === userId)) {
    throw new HttpError(403, "Not a participant in this conversation");
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: body.body,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType
    },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } }
  });

  const recipientIds = participants.map((p) => p.userId).filter((id) => id !== userId);
  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        userId: recipientId,
        actorId: userId,
        type: NotificationType.MESSAGE,
        entityId: conversationId
      }))
    });
  }

  res.status(201).json(message);
}

export async function markSeen(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { messageId } = req.params;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { include: { users: true } } }
  });

  if (!message) {
    throw new HttpError(404, "Message not found");
  }

  const isParticipant = message.conversation.users.some((u) => u.userId === userId);
  if (!isParticipant) {
    throw new HttpError(403, "Not allowed");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { seenAt: new Date() }
  });

  res.json(updated);
}
