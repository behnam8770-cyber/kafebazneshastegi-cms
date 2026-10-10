export async function onRequestGet() {
  return Response.json({ authenticated: false, message: "API is working" });
}

export async function onRequestPost() {
  return Response.json({ ok: true, message: "Login endpoint reached" });
}
