# Rotating Shop Schema Notes

This project stores rotating shop state in `market-db.json`.

## Added structures

- `shopState`
  - `dateKey: string` (YYYY-MM-DD)
  - `lastUpdatedAt: number` (ms timestamp)
  - `lastProcessedSpawnAt: number` (ms timestamp)
  - `slots: Array<ShopSlot>`

- `dailyShopSchedules`
  - keyed by `dateKey`
  - value:
    - `dateKey: string`
    - `generatedAt: number`
    - `specialSpawns: number[]` (spawn timestamps in that day)

## ShopSlot shape

- `slotId: string`
- `slotType: "normal" | "special"`
- `itemId: string | null`
- `name: string | null`
- `rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | null`
- `price: number | null`
- `createdAt: number | null`
- `expiresAt: number`

## User progress integration

Purchases update `userProgress[username].progress`:

- `bankBalance` decremented server-side.
- `inventory[itemId].qty` incremented (capped by item `maxStack`).
- Transaction appended to `txLog`.

## Migration/Init behavior

No manual migration script is required.

On server start / first shop API call:

1. `dailyShopSchedules` and `shopState` are initialized if missing.
2. 4 normal slots are rolled immediately.
3. 2 special slots remain empty until special spawn times trigger.
4. Expired slots are rotated on each shop tick and shop API request.

## Dev testing route

Admin route to force rotation:

- `POST /api/shop/admin/force-rotate`
- Requires admin bearer token.
