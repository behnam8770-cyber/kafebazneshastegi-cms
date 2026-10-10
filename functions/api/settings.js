import { isAuthenticated } from "./auth.js";
import { ensureSchema, json, getSettingsMap } from "./db.js";

const ALLOWED = [
  "site_title",
  "site_tagline",
  "bale_bot_token",
  "bale_chat_id",
  "telegram_bot_token",
  "telegram_chat_id",
  "instagram_note",
  "eitaa_note"
];

export async function onRequestGet(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  if (!db) return json({ error: "Binding با نام DB پیدا نشد." }, 500);
  await ensureSchema(db);
  const map = await getSettingsMap(db);
  // توکن‌ها را کامل برنگردان — فقط وضعیت
  const safe = { ...map };
  for (const k of ["bale_bot_token", "telegram_bot_token"]) {
    if (safe[k]) safe[k] = safe[k].slice(0, 6) + "…";
  }
  return json({
    settings: map,
    safe,
    env_flags: {
      bale_env: !!(context.env.BALE_BOT_TOKEN && context.env.BALE_CHAT_ID),
      telegram_env: !!(context.env.TELEGRAM_BOT_TOKEN && context.env.TELEGRAM_CHAT_ID)
    }
  });
}

export async function onRequestPut(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureSchema(db);
  let b;
  try { b = await context.request.json(); } catch { return json({ error: "داده نامعتبر است." }, 400); }
  const entries = Object.entries(b || {}).filter(([k]) => ALLOWED.includes(k));
  for (const [key, value] of entries) {
    await db.prepare(
      `INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`
    ).bind(key, String(value ?? "")).run();
  }
  return json({ ok: true });
}
