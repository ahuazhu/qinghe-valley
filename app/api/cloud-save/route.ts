import { env } from "cloudflare:workers";

const PUBLIC_SITE = "https://qinghe-valley.ahuazhu.chatgpt.site";
const TOKEN_PATTERN = /^[a-f0-9-]{36}$/;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function ensureSchema() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS cloud_saves (
      token TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_cloud_saves_updated ON cloud_saves(updated_at)"),
  ]);
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!TOKEN_PATTERN.test(token)) return json({ error: "存档码无效" }, 400);

  await ensureSchema();
  const save = await env.DB.prepare("SELECT payload FROM cloud_saves WHERE token = ? LIMIT 1")
    .bind(token).first<{ payload: string }>();
  if (!save) return json({ error: "没有找到这份存档" }, 404);
  return json({ save: JSON.parse(save.payload) });
}

export async function POST(request: Request) {
  const body = await request.json<{ save?: unknown }>();
  if (!body.save || typeof body.save !== "object") return json({ error: "没有可转移的游戏存档" }, 400);
  const payload = JSON.stringify(body.save);
  if (payload.length > 100_000) return json({ error: "存档内容过大" }, 413);

  await ensureSchema();
  const token = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO cloud_saves (token, payload, updated_at) VALUES (?, ?, ?)")
    .bind(token, payload, Date.now()).run();
  return json({ token, transferUrl: `${PUBLIC_SITE}/?save=${token}` }, 201);
}
