import { isAuthenticated } from "./auth.js";
import { sendToSocial } from "./social.js";

function slugify(title) {
  return (title || "post").trim().toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) + "-" + Date.now().toString(36);
}

async function ensureTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    category TEXT DEFAULT 'عمومی',
    image_url TEXT DEFAULT '',
    author TEXT DEFAULT 'کافه بازنشستگی',
    status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT
  )`).run();
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function getSiteUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) return json({ error: "Binding با نام DB پیدا نشد." }, 500);
  await ensureTable(db);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const row = await db.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
    if (!row) return json({ error: "مطلب پیدا نشد." }, 404);
    if (row.status !== "published" && !(await isAuthenticated(context.request, context.env))) {
      return json({ error: "مطلب منتشر نشده است." }, 404);
    }
    return json({ post: row });
  }
  const admin = await isAuthenticated(context.request, context.env);
  const category = url.searchParams.get("category");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  let sql = "SELECT * FROM posts ";
  const binds = [];
  if (admin) sql += "WHERE 1=1 ";
  else sql += "WHERE status='published' ";
  if (category) {
    sql += "AND category=? ";
    binds.push(category);
  }
  sql += "ORDER BY COALESCE(published_at,created_at) DESC LIMIT ?";
  binds.push(limit);
  const result = await db.prepare(sql).bind(...binds).all();
  return json({ posts: result.results || [] });
}

export async function onRequestPost(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureTable(db);
  let b;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: "داده نامعتبر است." }, 400);
  }
  if (!b.title?.trim()) return json({ error: "عنوان الزامی است." }, 400);
  const now = new Date().toISOString();
  const status = b.status === "published" ? "published" : "draft";
  const publishedAt = status === "published" ? (b.published_at || now) : null;
  const r = await db.prepare(
    `INSERT INTO posts(title,slug,excerpt,content,category,image_url,author,status,created_at,updated_at,published_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`
  )
    .bind(
      b.title.trim(),
      slugify(b.title),
      b.excerpt || "",
      b.content || "",
      b.category || "عمومی",
      b.image_url || "",
      b.author || "کافه بازنشستگی",
      status,
      now,
      now,
      publishedAt
    )
    .run();

  const id = r.meta?.last_row_id;
  let social = [];
  if (status === "published" && id) {
    const post = {
      id,
      title: b.title.trim(),
      excerpt: b.excerpt || "",
      category: b.category || "عمومی"
    };
    social = await sendToSocial(post, context.env, getSiteUrl(context.request));
  }
  return json({ ok: true, id, social }, 201);
}

export async function onRequestPut(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const db = context.env.DB;
  await ensureTable(db);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "شناسه مطلب لازم است." }, 400);
  let b;
  try {
    b = await context.request.json();
  } catch {
    return json({ error: "داده نامعتبر است." }, 400);
  }
  const old = await db.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
  if (!old) return json({ error: "مطلب پیدا نشد." }, 404);
  const now = new Date().toISOString();
  const status = b.status === "published" ? "published" : "draft";
  const wasDraft = old.status !== "published";
  const publishedAt = status === "published" ? (old.published_at || now) : null;
  await db.prepare(
    `UPDATE posts SET title=?,excerpt=?,content=?,category=?,image_url=?,author=?,status=?,updated_at=?,published_at=? WHERE id=?`
  )
    .bind(
      b.title?.trim() || old.title,
      b.excerpt ?? old.excerpt,
      b.content ?? old.content,
      b.category || old.category,
      b.image_url ?? old.image_url,
      b.author || old.author,
      status,
      now,
      publishedAt,
      id
    )
    .run();

  let social = [];
  // فقط وقتی برای اولین بار منتشر می‌شود، به شبکه‌ها بفرست
  if (status === "published" && wasDraft) {
    const post = {
      id,
      title: b.title?.trim() || old.title,
      excerpt: b.excerpt ?? old.excerpt,
      category: b.category || old.category
    };
    social = await sendToSocial(post, context.env, getSiteUrl(context.request));
  }
  return json({ ok: true, social });
}

export async function onRequestDelete(context) {
  if (!(await isAuthenticated(context.request, context.env))) {
    return json({ error: "نیاز به ورود مدیر دارد." }, 401);
  }
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "شناسه مطلب لازم است." }, 400);
  await context.env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run();
  return json({ ok: true });
}
