import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { signupSchema, loginSchema, refreshSchema } from "../validators/auth";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/http";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt";

function authPayload(user: {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  petName: string | null;
  petBio: string | null;
  petAvatarUrl: string | null;
  isPrivate: boolean;
}) {
  const tokenBase = { userId: user.id, email: user.email, username: user.username };
  const accessToken = signAccessToken(tokenBase);
  const refreshToken = signRefreshToken(tokenBase);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      petName: user.petName,
      petBio: user.petBio,
      petAvatarUrl: user.petAvatarUrl,
      isPrivate: user.isPrivate
    }
  };
}

export async function signup(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: body.email }, { username: body.username }]
    }
  });

  if (existing) {
    throw new HttpError(409, "Email or username already in use");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      username: body.username,
      passwordHash,
      name: body.name
    }
  });

  const payload = authPayload(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(payload.refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.status(201).json(payload);
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const payload = authPayload(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(payload.refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.json(payload);
}

export async function refresh(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  const parsed = verifyRefreshToken(body.refreshToken);
  const tokenHash = hashToken(body.refreshToken);

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token is invalid or expired");
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const payload = authPayload(user);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(payload.refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.json(payload);
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      petName: true,
      petBio: true,
      petAvatarUrl: true,
      isPrivate: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true
        }
      }
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  res.json(user);
}

export async function logout(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(body.refreshToken) } });
  res.status(204).send();
}
