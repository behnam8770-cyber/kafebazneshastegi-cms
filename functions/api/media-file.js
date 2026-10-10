import { ensureSchema } from "./db.js";

/** سرو تصویر ذخیره‌شده در D1 — مسیر عمومی: /api/media-file?id= */
export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return new Response("DB missing", { status: 500 });
  await ensureSchema(db);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });
  const row = await db.prepare("SELECT mime, data_url FROM media WHERE id=?").bind(id).first();
  if (!row || !row.data_url) return new Response("Not found", { status: 404 });

  // data:image/jpeg;base64,....
  const m = String(row.data_url).match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {
    return Response.redirect(row.data_url, 302);
  }
  const binary = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
  return new Response(binary, {
    headers: {
      "Content-Type": m[1] || row.mime || "image/jpeg",
      "Cache-Control": "public, max-age=31536000"
    }
  });
}
