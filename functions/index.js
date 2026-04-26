import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

// إعداداتك الثابتة
const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";
const stringSession = new StringSession(""); // اتركها فارغة، البوت سيعمل بالتوكن

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");

    if (path[1] === "watch" && path[2] && path[3]) {
      const msgId = parseInt(path[2]);
      const chatId = path[3];

      try {
        if (!client.connected) {
          await client.start({ botAuthToken: botToken });
        }

        // جلب الرسالة التي تحتوي على الفيلم
        const messages = await client.getMessages(chatId, { ids: [msgId] });
        if (!messages || !messages[0].media) {
          return new Response("الفيديو غير موجود أو الرسالة خاطئة", { status: 404 });
        }

        const media = messages[0].media;
        
        // تقنية البث المباشر للأحجام الكبيرة
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        // بدء عملية القراءة والصب (Streaming)
        (async () => {
          const bufferSize = 512 * 1024; // قراءة نصف ميجا في كل مرة
          const stream = client.iterDownload({
            file: media,
            requestSize: bufferSize,
          });

          for await (const chunk of stream) {
            await writer.write(chunk);
          }
          await writer.close();
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Content-Disposition": "inline",
            "Accept-Ranges": "bytes",
          },
        });

      } catch (e) {
        return new Response("خطأ في البث: " + e.message, { status: 500 });
      }
    }

    return new Response("✅ سيرفر Jiyan Cinema جاهز لبث الأفلام الكبيرة (1GB+).");
  },
};
      
