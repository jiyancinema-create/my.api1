
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";
const stringSession = new StringSession(""); 

const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");

    // 1. إذا كان المسار /watch، ابدأ البث
    if (path[1] === "watch" && path[2] && path[3]) {
      const msgId = parseInt(path[2]);
      const chatId = path[3];

      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });

        const messages = await client.getMessages(chatId, { ids: [msgId] });
        if (!messages || !messages[0].media) return new Response("الفيديو غير موجود", { status: 404 });

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        (async () => {
          const stream = client.iterDownload({ file: messages[0].media, requestSize: 1024 * 1024 });
          for await (const chunk of stream) await writer.write(chunk);
          await writer.close();
        })();

        return new Response(readable, { headers: { "Content-Type": "video/mp4", "Access-Control-Allow-Origin": "*" } });
      } catch (e) {
        return new Response("Error: " + e.message, { status: 500 });
      }
    }

    // 2. إذا دخلت على الرابط المباشر (إصلاح الـ 404)
    return new Response("✅ سيرفر Jiyan Cinema متصل وجاهز للبث! استخدم مسار /watch للتشغيل.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  },
};
  
