// ارسال خودکار به بله و تلگرام
export async function sendToSocial(post, env, siteUrl) {
  const results = [];
  const text = buildMessage(post, siteUrl);

  // بله (Bale) - سازگار با API تلگرام
  if (env.BALE_BOT_TOKEN && env.BALE_CHAT_ID) {
    try {
      const res = await fetch(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.BALE_CHAT_ID,
          text: text,
          parse_mode: "HTML",
          disable_web_page_preview: false
        })
      });
      const data = await res.json();
      results.push({ platform: "bale", ok: data.ok, error: data.description });
    } catch (e) {
      results.push({ platform: "bale", ok: false, error: e.message });
    }
  }

  // تلگرام
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: "HTML",
          disable_web_page_preview: false
        })
      });
      const data = await res.json();
      results.push({ platform: "telegram", ok: data.ok, error: data.description });
    } catch (e) {
      results.push({ platform: "telegram", ok: false, error: e.message });
    }
  }

  return results;
}

function buildMessage(post, siteUrl) {
  const url = `${siteUrl}/article.html?id=${post.id}`;
  let msg = `<b>${escapeHtml(post.title)}</b>\n\n`;
  if (post.excerpt) msg += `${escapeHtml(post.excerpt)}\n\n`;
  msg += `📂 ${escapeHtml(post.category || "عمومی")}\n`;
  msg += `🔗 <a href="${url}">مطالعه کامل در کافه بازنشستگی</a>`;
  return msg;
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
