# Insta Clone Monorepo MVP

Instagram-style social app MVP with:
- Expo React Native mobile app
- Express + Prisma + PostgreSQL API
- Shared TypeScript types

## Structure
- `apps/api`: backend API
- `apps/mobile`: Expo client
- `packages/shared`: shared contracts/types

## Quick Start
1. Install dependencies:
   - `pnpm install`
2. Copy env templates:
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/mobile/.env.example apps/mobile/.env`
3. Start PostgreSQL and update `DATABASE_URL`.
4. Run database setup:
   - `pnpm db:generate`
   - `pnpm db:migrate`
   - `pnpm db:seed`
5. Run apps:
   - API: `pnpm dev:api`
   - Mobile: `pnpm dev:mobile`

## Demo Test User
- email: `demo@insta.dev`
- password: `password123`

## Notes
- This is a production-minded MVP scaffold with core features wired for extension.
- Cloudinary + push notifications are scaffolded with env vars but not fully integrated in this baseline.
