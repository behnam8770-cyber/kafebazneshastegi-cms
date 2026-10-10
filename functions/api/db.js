/** مشترک: ساخت جدول‌ها و خواندن تنظیمات از D1 */

export async function ensureSchema(db) {
  if (!db) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
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
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT DEFAULT '',
      status TEXT DEFAULT 'published',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      data_url TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )`)
  ]);
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function getSiteUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function getSettingsMap(db) {
  if (!db) return {};
  await ensureSchema(db);
  const result = await db.prepare("SELECT key, value FROM settings").all();
  const map = {};
  for (const row of result.results || []) map[row.key] = row.value || "";
  return map;
}

export async function getSetting(db, key, fallback = "") {
  const map = await getSettingsMap(db);
  return map[key] ?? fallback;
}
