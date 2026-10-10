import { isAuthenticated } from "./auth.js";
import { ensureSchema, json } from "./db.js";

function slugify(title, fallback) {
  const base = (title || fallback || "page").trim().toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
  return base || "page-" + Date.now().toString(36);
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "Binding با نام DB پیدا نشد." }, 500);
  await ensureSchema(db);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const slug = url.searchParams.get("slug");
  if (id || slug) {
    const row = id
      ? await db.prepare("SELECT * FROM pages WHERE id=?").bind(id).first()
      : await db.prepare("SELECT * FROM pages WHERE slug=?").bind(slug).first();
    if (!row) return json({ error: "صفحه پیدا نشد." }, 404);
    if (row.status !== "published" && !(await isAuthenticated(context.request, context.env))) {
      return json({ error: "صفحه منتشر نشده است." }, 404);
    }
    return json({ page: row });
  }
  const admin = await isAuthenticated(context.request, context.env);
  const sql = admin
    ? "SELECT id,title,slug,status,updated_at,created_at FROM pages ORDER BY updated_at DESC"
    : "SELECT id,title,slug,status,updated_at,created_at FROM pages WHERE status='published' ORDER BY title";
  const result = await db.prepare(sql).all();
  return json({ pages: result.results || [] });
}

export async function onRequestPost(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureSchema(db);
  let b;
  try { b = await context.request.json(); } catch { return json({ error: "داده نامعتبر است." }, 400); }
  if (!b.title?.trim()) return json({ error: "عنوان الزامی است." }, 400);
  const now = new Date().toISOString();
  const slug = (b.slug && b.slug.trim()) ? slugify(b.slug) : slugify(b.title);
  const status = b.status === "draft" ? "draft" : "published";
  try {
    const r = await db.prepare(
      `INSERT INTO pages(title,slug,content,status,created_at,updated_at) VALUES(?,?,?,?,?,?)`
    ).bind(b.title.trim(), slug, b.content || "", status, now, now).run();
    return json({ ok: true, id: r.meta?.last_row_id, slug }, 201);
  } catch (e) {
    return json({ error: "اسلاگ تکراری است یا خطا در ذخیره: " + (e.message || "") }, 400);
  }
}

export async function onRequestPut(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureSchema(db);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "شناسه صفحه لازم است." }, 400);
  let b;
  try { b = await context.request.json(); } catch { return json({ error: "داده نامعتبر است." }, 400); }
  const old = await db.prepare("SELECT * FROM pages WHERE id=?").bind(id).first();
  if (!old) return json({ error: "صفحه پیدا نشد." }, 404);
  const now = new Date().toISOString();
  const status = b.status === "draft" ? "draft" : "published";
  const slug = b.slug?.trim() ? slugify(b.slug) : old.slug;
  try {
    await db.prepare(
      `UPDATE pages SET title=?,slug=?,content=?,status=?,updated_at=? WHERE id=?`
    ).bind(b.title?.trim() || old.title, slug, b.content ?? old.content, status, now, id).run();
    return json({ ok: true, slug });
  } catch (e) {
    return json({ error: "خطا در به‌روزرسانی: " + (e.message || "") }, 400);
  }
}

export async function onRequestDelete(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "شناسه صفحه لازم است." }, 400);
  await context.env.DB.prepare("DELETE FROM pages WHERE id=?").bind(id).run();
  return json({ ok: true });
}
