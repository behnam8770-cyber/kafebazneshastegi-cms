const enc = new TextEncoder();

function b64u(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64uStr(s) { return b64u(enc.encode(s)); }
function fromB64u(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign"]);
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}
function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
async function isAuthenticated(request, env) {
  const token = getCookie(request, "kb_session");
  if (!token || !env.ADMIN_PASSWORD) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload, env.SESSION_SECRET || env.ADMIN_PASSWORD);
  if (sig !== expected) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromB64u(payload)));
    return data.exp > Date.now();
  } catch { return false; }
}

export async function onRequestGet(context) {
  return Response.json({ authenticated: await isAuthenticated(context.request, context.env) });
}

export async function onRequestPost(context) {
  const env = context.env;
  if (!env.ADMIN_PASSWORD) return Response.json({error:"ADMIN_PASSWORD تنظیم نشده است."},{status:500});
  let body = {};
  try { body = await context.request.json(); } catch {}
  if (body.password !== env.ADMIN_PASSWORD) return Response.json({error:"رمز عبور نادرست است."},{status:401});
  const payload = b64uStr(JSON.stringify({exp: Date.now()+1000*60*60*24*7}));
  const sig = await sign(payload, env.SESSION_SECRET || env.ADMIN_PASSWORD);
  const headers = new Headers({"Content-Type":"application/json"});
  headers.append("Set-Cookie", `kb_session=${encodeURIComponent(payload+"."+sig)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
  return new Response(JSON.stringify({ok:true}), {status:200, headers});
}

export async function onRequestDelete() {
  const headers = new Headers({"Content-Type":"application/json"});
  headers.append("Set-Cookie","kb_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  return new Response(JSON.stringify({ok:true}),{headers});
}

export { isAuthenticated };
