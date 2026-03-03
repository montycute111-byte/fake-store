# Insta Clone MVP Docs

## Folder Structure

```text
insta-clone/
  apps/
    api/
      prisma/
        schema.prisma
        seed.ts
      src/
        app.ts
        server.ts
        config/
        controllers/
        middleware/
        routes/
        utils/
        validators/
    mobile/
      App.tsx
      index.ts
      components/
      hooks/
      lib/
      types/
  packages/
    shared/
      src/index.ts
```

## Database Schema

Core models:
- `User`
- `RefreshToken`
- `Post`
- `Comment`
- `Like`
- `Save`
- `Follow`
- `Conversation`
- `ConversationUser`
- `Message`
- `Notification`

Enums:
- `MediaType` (`IMAGE`, `VIDEO`)
- `NotificationType` (`LIKE`, `COMMENT`, `FOLLOW`, `MESSAGE`)

See `apps/api/prisma/schema.prisma` for full relations, indexes, and constraints.

## API Routes

Base URL: `/api`

Auth:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Profiles:
- `GET /profiles/:username`
- `PATCH /profiles/me`
- `POST /profiles/:userId/follow`
- `DELETE /profiles/:userId/follow`

Posts:
- `GET /posts/feed`
- `GET /posts/explore`
- `POST /posts`
- `DELETE /posts/:postId`
- `POST /posts/:postId/likes`
- `POST /posts/:postId/saves`
- `GET /posts/:postId/comments`
- `POST /posts/:postId/comments`

Messages:
- `POST /messages/conversations`
- `GET /messages/conversations`
- `GET /messages/conversations/:conversationId/messages`
- `POST /messages/conversations/:conversationId/messages`
- `POST /messages/:messageId/seen`

Notifications:
- `GET /notifications`
- `POST /notifications/:notificationId/read`

## Setup

1. Install dependencies:
   - `pnpm install`
2. Env setup:
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/mobile/.env.example apps/mobile/.env`
3. Start PostgreSQL and set `DATABASE_URL`.
4. Generate/migrate/seed DB:
   - `pnpm db:generate`
   - `pnpm db:migrate`
   - `pnpm db:seed`
5. Run:
   - `pnpm dev:api`
   - `pnpm dev:mobile`

## Expo QR Preview

From `insta-clone`:
- `pnpm dev:mobile`
- Scan the QR code in Expo Go.

## Environment Templates

- API env: `apps/api/.env.example`
- Mobile env: `apps/mobile/.env.example`
