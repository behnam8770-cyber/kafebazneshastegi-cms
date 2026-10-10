import { isAuthenticated } from "./auth.js";
import { ensureSchema, json } from "./db.js";

const MAX_BYTES = 180 * 1024; // حدود ۱۸۰ کیلوبایت — مناسب D1 رایگان

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "Binding با نام DB پیدا نشد." }, 500);
  await ensureSchema(db);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const row = await db.prepare("SELECT id,filename,mime,data_url,size,created_at FROM media WHERE id=?").bind(id).first();
    if (!row) return json({ error: "فایل پیدا نشد." }, 404);
    return json({ media: row });
  }
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const result = await db.prepare(
    "SELECT id,filename,mime,size,created_at, substr(data_url,1,40) AS preview FROM media ORDER BY id DESC LIMIT 100"
  ).all();
  return json({ media: result.results || [] });
}

export async function onRequestPost(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureSchema(db);
  let b;
  try { b = await context.request.json(); } catch { return json({ error: "داده نامعتبر است." }, 400); }
  const dataUrl = b.data_url || "";
  if (!dataUrl.startsWith("data:image/")) {
    return json({ error: "فقط تصویر (data URL) پذیرفته می‌شود." }, 400);
  }
  const approx = Math.ceil((dataUrl.length * 3) / 4);
  if (approx > MAX_BYTES) {
    return json({ error: "حجم تصویر زیاد است. حداکثر حدود ۱۵۰KB (پس از فشرده‌سازی در مرورگر)." }, 400);
  }
  const mimeMatch = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const filename = (b.filename || "image").replace(/[^\w\u0600-\u06FF.-]+/g, "_").slice(0, 80);
  const now = new Date().toISOString();
  const r = await db.prepare(
    `INSERT INTO media(filename,mime,data_url,size,created_at) VALUES(?,?,?,?,?)`
  ).bind(filename, mime, dataUrl, approx, now).run();
  const id = r.meta?.last_row_id;
  // آدرس قابل استفاده در مطلب
  const url = `/api/media-file?id=${id}`;
  return json({ ok: true, id, url, size: approx }, 201);
}

export async function onRequestDelete(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "شناسه لازم است." }, 400);
  await context.env.DB.prepare("DELETE FROM media WHERE id=?").bind(id).run();
  return json({ ok: true });
}
