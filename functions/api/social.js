/** ارسال خودکار به بله و تلگرام — توکن از env یا جدول settings */

export async function sendToSocial(post, env, siteUrl, settings = {}) {
  const results = [];
  const text = buildMessage(post, siteUrl);

  const baleToken = env.BALE_BOT_TOKEN || settings.bale_bot_token;
  const baleChat = env.BALE_CHAT_ID || settings.bale_chat_id;
  const tgToken = env.TELEGRAM_BOT_TOKEN || settings.telegram_bot_token;
  const tgChat = env.TELEGRAM_CHAT_ID || settings.telegram_chat_id;

  if (baleToken && baleChat) {
    results.push(await sendBaleOrTelegram(
      `https://tapi.bale.ai/bot${baleToken}/sendMessage`,
      baleChat,
      text,
      post.image_url,
      "bale"
    ));
  }

  if (tgToken && tgChat) {
    results.push(await sendBaleOrTelegram(
      `https://api.telegram.org/bot${tgToken}/sendMessage`,
      tgChat,
      text,
      post.image_url,
      "telegram"
    ));
  }

  return results;
}

async function sendBaleOrTelegram(apiUrl, chatId, text, imageUrl, platform) {
  try {
    // اگر تصویر URL عمومی دارد، اول عکس بفرست
    if (imageUrl && /^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith("data:")) {
      const photoApi = apiUrl.replace(/sendMessage$/, "sendPhoto");
      const res = await fetch(photoApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: text.slice(0, 1000),
          parse_mode: "HTML"
        })
      });
      const data = await res.json();
      if (data.ok) return { platform, ok: true };
      // اگر sendPhoto شکست خورد، متن ساده بفرست
    }

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });
    const data = await res.json();
    return { platform, ok: !!data.ok, error: data.description };
  } catch (e) {
    return { platform, ok: false, error: e.message };
  }
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
