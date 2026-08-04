import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const multiplayerPlayers = sqliteTable(
  "multiplayer_players",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roomCode: text("room_code").notNull(),
    deviceId: text("device_id").notNull(),
    playerName: text("player_name").notNull(),
    village: text("village").notNull(),
    x: integer("x").notNull().default(6),
    y: integer("y").notNull().default(5),
    day: integer("day").notNull().default(1),
    hour: integer("hour").notNull().default(7),
    energy: integer("energy").notNull().default(100),
    sick: integer("sick", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_multiplayer_room_device").on(table.roomCode, table.deviceId),
    index("idx_multiplayer_room_updated").on(table.roomCode, table.updatedAt),
  ],
);

export const cloudSaves = sqliteTable(
  "cloud_saves",
  {
    token: text("token").primaryKey(),
    payload: text("payload").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_cloud_saves_updated").on(table.updatedAt)],
);
