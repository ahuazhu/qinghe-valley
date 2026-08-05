import { env } from "cloudflare:workers";

type VillageId = "qinghe" | "maple";
type Scene = "farm" | "town" | "cultureDistrict" | "eastNeighbor" | "southNeighbor" | "northNeighbor";

type MultiplayerPayload = {
  roomCode?: string;
  deviceId?: string;
  playerName?: string;
  village?: VillageId;
  currentVillage?: VillageId;
  scene?: Scene;
  x?: number;
  y?: number;
  day?: number;
  hour?: number;
  energy?: number;
  sick?: boolean;
};

type PlayerRow = {
  device_id: string;
  player_name: string;
  village: VillageId;
  current_village: VillageId | null;
  scene: Scene | null;
  x: number;
  y: number;
  day: number;
  hour: number;
  energy: number;
  sick: number;
  updated_at: number;
};

const ROOM_PATTERN = /^[A-Z0-9]{4,8}$/;

async function ensureSchema() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS multiplayer_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_code TEXT NOT NULL,
      device_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      village TEXT NOT NULL,
      current_village TEXT,
      scene TEXT,
      x INTEGER NOT NULL DEFAULT 6,
      y INTEGER NOT NULL DEFAULT 5,
      day INTEGER NOT NULL DEFAULT 1,
      hour INTEGER NOT NULL DEFAULT 7,
      energy INTEGER NOT NULL DEFAULT 100,
      sick INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_multiplayer_room_device ON multiplayer_players(room_code, device_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_multiplayer_room_updated ON multiplayer_players(room_code, updated_at)"),
  ]);
  try { await env.DB.prepare("ALTER TABLE multiplayer_players ADD COLUMN current_village TEXT").run(); } catch { /* column already exists */ }
  try { await env.DB.prepare("ALTER TABLE multiplayer_players ADD COLUMN scene TEXT").run(); } catch { /* column already exists */ }
}

function cleanRoomCode(value?: string) {
  const roomCode = value?.trim().toUpperCase() ?? "";
  return ROOM_PATTERN.test(roomCode) ? roomCode : null;
}

function cleanDeviceId(value?: string) {
  const deviceId = value?.trim() ?? "";
  return /^[a-zA-Z0-9-]{8,64}$/.test(deviceId) ? deviceId : null;
}

function serializePlayers(rows: PlayerRow[], now: number) {
  return rows.map((row) => ({
    deviceId: row.device_id,
    playerName: row.player_name,
    village: row.village,
    currentVillage: row.current_village === "maple" ? "maple" : row.current_village === "qinghe" ? "qinghe" : row.village,
    scene: ["farm", "town", "cultureDistrict", "eastNeighbor", "southNeighbor", "northNeighbor"].includes(row.scene ?? "") ? row.scene : "farm",
    x: row.x,
    y: row.y,
    day: row.day,
    hour: row.hour,
    energy: row.energy,
    sick: Boolean(row.sick),
    online: now - row.updated_at < 15_000,
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roomCode = cleanRoomCode(url.searchParams.get("roomCode") ?? undefined);
  if (!roomCode) return Response.json({ error: "房间码格式不正确" }, { status: 400 });

  await ensureSchema();
  const now = Date.now();
  const result = await env.DB.prepare(`SELECT device_id, player_name, village, current_village, scene, x, y, day, hour, energy, sick, updated_at
    FROM multiplayer_players WHERE room_code = ? ORDER BY id ASC LIMIT 2`).bind(roomCode).all<PlayerRow>();
  return Response.json({ roomCode, players: serializePlayers(result.results, now) });
}

export async function POST(request: Request) {
  const payload = await request.json<MultiplayerPayload>();
  const roomCode = cleanRoomCode(payload.roomCode);
  const deviceId = cleanDeviceId(payload.deviceId);
  const playerName = payload.playerName?.trim().slice(0, 12) || "小禾";
  const requestedVillage = payload.village === "maple" ? "maple" : "qinghe";
  const currentVillage = payload.currentVillage === "maple" ? "maple" : payload.currentVillage === "qinghe" ? "qinghe" : requestedVillage;
  const currentScene: Scene = ["farm", "town", "cultureDistrict", "eastNeighbor", "southNeighbor", "northNeighbor"].includes(payload.scene ?? "") ? payload.scene as Scene : "farm";
  if (!roomCode || !deviceId) return Response.json({ error: "房间信息不正确" }, { status: 400 });

  await ensureSchema();
  const now = Date.now();
  await env.DB.prepare("DELETE FROM multiplayer_players WHERE room_code = ? AND updated_at < ?")
    .bind(roomCode, now - 60_000)
    .run();
  const existing = await env.DB.prepare("SELECT device_id, village FROM multiplayer_players WHERE room_code = ? ORDER BY id ASC LIMIT 2")
    .bind(roomCode).all<{ device_id: string; village: VillageId }>();
  const own = existing.results.find((player) => player.device_id === deviceId);
  if (!own && existing.results.length >= 2) return Response.json({ error: "这个房间已经有两位玩家了" }, { status: 409 });
  if (!own && existing.results.some((player) => player.village === requestedVillage)) {
    return Response.json({ error: requestedVillage === "qinghe" ? "青禾村已经有人居住，请选择枫叶村" : "枫叶村已经有人居住，请选择青禾村" }, { status: 409 });
  }

  const village = own?.village ?? requestedVillage;
  await env.DB.prepare(`INSERT INTO multiplayer_players
    (room_code, device_id, player_name, village, current_village, scene, x, y, day, hour, energy, sick, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(room_code, device_id) DO UPDATE SET
      player_name = excluded.player_name,
      current_village = excluded.current_village,
      scene = excluded.scene,
      x = excluded.x,
      y = excluded.y,
      day = excluded.day,
      hour = excluded.hour,
      energy = excluded.energy,
      sick = excluded.sick,
      updated_at = excluded.updated_at`)
    .bind(roomCode, deviceId, playerName, village, currentVillage, currentScene, payload.x ?? 6, payload.y ?? 5, payload.day ?? 1, payload.hour ?? 7, payload.energy ?? 100, payload.sick ? 1 : 0, now)
    .run();

  const result = await env.DB.prepare(`SELECT device_id, player_name, village, current_village, scene, x, y, day, hour, energy, sick, updated_at
    FROM multiplayer_players WHERE room_code = ? ORDER BY id ASC LIMIT 2`).bind(roomCode).all<PlayerRow>();
  return Response.json({ roomCode, village, players: serializePlayers(result.results, now) });
}

export async function DELETE(request: Request) {
  const payload = await request.json<MultiplayerPayload>();
  const roomCode = cleanRoomCode(payload.roomCode);
  const deviceId = cleanDeviceId(payload.deviceId);
  if (!roomCode || !deviceId) return Response.json({ error: "房间信息不正确" }, { status: 400 });

  await ensureSchema();
  await env.DB.prepare("DELETE FROM multiplayer_players WHERE room_code = ? AND device_id = ?")
    .bind(roomCode, deviceId)
    .run();
  return Response.json({ ok: true });
}
