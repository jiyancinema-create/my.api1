import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";
const session = new StringSession(""); 

const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");

    // مسار البث: /watch/رقم_الرسالة/اسم_القناة
    if (path[1] === "watch" && path[2] && path[3]) {
      const msgId = parseInt(path[2]);
      const chatId = path[3];

      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });

        const messages = await client.getMessages(chatId, { ids: [msgId] });
        if (!messages.length || !messages[0].media) {
          return new Response("❌ لم يتم العثور على ميديا في هذه الرسالة", { status: 404 });
        }

        const media = messages[0].media;
        const fileSize = media.document ? media.document.size : (media.video ? media.video.size : null);

        // إنشاء قناة بث مباشرة (Stream) لتقليل استهلاك الذاكرة
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // بدء عملية السحب من تليجرام في الخلفية
        (async () => {
          const iterable = client.iterDownload({
            file: media,
            requestSize: 1024 * 1024, // سحب 1 ميجا في كل نبضة
          });

          for await (const chunk of iterable) {
            await writer.write(chunk);
          }
          await writer.close();
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize,
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (err) {
        return new Response("⚠️ خطأ في السيرفر: " + err.message, { status: 500 });
      }
    }

    return new Response("✅ سيرفر Jiyan Cinema متصل وجاهز لبث الأحجام الكبيرة.");
  }
};
