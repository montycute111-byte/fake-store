# MegaCart Global Listing Backend

This project now supports centralized, persistent global listings via `server.mjs`.

## Start

1. Use Node.js 18+.
2. From `/Users/roninclark/Documents/New project`, run:

```bash
ADMIN_PASSWORD=your_admin_password node server.mjs
```

3. Open:

`http://localhost:3000`

## Admin Auth

- Admin username is fixed: `ronin`
- Admin password is the `ADMIN_PASSWORD` environment variable used when starting server.
- Only authenticated admin sessions can create/update/delete listings.

## Persistence

- Listings and admin sessions are stored in:
  - `/Users/roninclark/Documents/New project/market-db.json`
- Data persists across refresh, logout, and server restarts.

## Realtime Sync

- Clients subscribe to `/api/events` (SSE).
- New/updated/deleted listings sync live to all connected clients.
- New listing emits a global "New Drop" event.
