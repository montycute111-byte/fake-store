import bcrypt from "bcrypt";
import { PrismaClient, MediaType, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@insta.dev" },
    update: {},
    create: {
      email: "demo@insta.dev",
      username: "demo_user",
      passwordHash: hash,
      name: "Demo User",
      bio: "Building an Instagram-style app.",
      isPrivate: false
    }
  });

  const friend = await prisma.user.upsert({
    where: { email: "friend@insta.dev" },
    update: {},
    create: {
      email: "friend@insta.dev",
      username: "friend_user",
      passwordHash: hash,
      name: "Friend User",
      bio: "Testing social features.",
      isPrivate: false
    }
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: demo.id, followingId: friend.id } },
    update: {},
    create: { followerId: demo.id, followingId: friend.id }
  });

  const post = await prisma.post.create({
    data: {
      authorId: friend.id,
      caption: "Welcome to the demo feed",
      mediaUrl: "https://picsum.photos/seed/insta-demo/1080/1080",
      mediaType: MediaType.IMAGE
    }
  });

  await prisma.comment.create({
    data: {
      postId: post.id,
      userId: demo.id,
      body: "Looks great"
    }
  });

  await prisma.like.upsert({
    where: { postId_userId: { postId: post.id, userId: demo.id } },
    update: {},
    create: { postId: post.id, userId: demo.id }
  });

  await prisma.notification.create({
    data: {
      userId: friend.id,
      actorId: demo.id,
      type: NotificationType.LIKE,
      entityId: post.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
