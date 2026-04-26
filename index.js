import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";
const stringSession = new StringSession(""); 

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/"); // /watch/msgId/chatId

    // الاتصال بتليجرام إذا لم يكن متصلاً
    if (!client.connected) {
      await client.start({ botAuthToken: botToken });
    }

    if (path[1] === "watch") {
      const msgId = parseInt(path[2]);
      const chatId = path[3];

      try {
        const messages = await client.getMessages(chatId, { ids: [msgId] });
        if (!messages || !messages[0].media) {
          return new Response("الفيديو غير موجود", { status: 404 });
        }

        const media = messages[0].media;
        
        // إنشاء ReadableStream للبث (Streaming)
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // بدء عملية التحميل والضخ (Chunk by Chunk)
        (async () => {
          const stream = client.iterDownload({
            file: media,
            requestSize: 1024 * 1024, // 1MB chunks
          });

          for await (const chunk of stream) {
            await writer.write(chunk);
          }
          await writer.close();
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*", // مهم جداً لتطبيق Expo
          },
        });

      } catch (e) {
        return new Response("خطأ في البث: " + e.message, { status: 500 });
      }
    }

    return new Response("سيرفر Jiyan Cinema جاهز على كلافود فلير!");
  },
};
        
