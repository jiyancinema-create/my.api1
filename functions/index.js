import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";
const stringSession = new StringSession(""); 

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");

    // --- Webhook لتعقب الملفات وإرسال الـ ID ---
    if (request.method === "POST" && path[1] === "webhook") {
      try {
        const update = await request.json();
        const msg = update.channel_post || update.message;
        if (msg && (msg.video || msg.document || msg.text === "/test")) {
          const text = msg.text === "/test" ? "🚀 Jiyan Cinema Server is Ready!" : `✅ **تم الرصد!**\n🔹 ID: \`${msg.message_id}\`\n🔗 Link: \`https://my-api1.pages.dev/watch/${msg.message_id}/jiyan_cinema\``;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: msg.chat.id, text: text, parse_mode: "Markdown" })
          });
        }
      } catch (e) {}
      return new Response("OK");
    }

    // --- نظام البث (Streaming) ---
    if (path[1] === "watch" && path[2]) {
      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });
        const messages = await client.getMessages("jiyan_cinema", { ids: [parseInt(path[2])] });
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        (async () => {
          const stream = client.iterDownload({ file: messages[0].media, requestSize: 512 * 1024 });
          for await (const chunk of stream) { await writer.write(chunk); }
          await writer.close();
        })();
        return new Response(readable, { headers: { "Content-Type": "video/mp4", "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" } });
      } catch (e) { return new Response("Error: " + e.message); }
    }

    return new Response("✅ Jiyan Cinema API Online");
  }
};
