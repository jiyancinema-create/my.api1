import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

// إعدادات API تليجرام - تأكد من صحتها
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
    const path = url.pathname.split("/");

    // --- 1. قسم الـ Webhook (استقبال الميديا وإرسال الـ ID) ---
    if (request.method === "POST" && path[1] === "webhook") {
      try {
        const update = await request.json();
        const msg = update.channel_post || update.message;

        if (msg && (msg.video || msg.document || msg.text === "/test")) {
          const chatId = msg.chat.id;
          const msgId = msg.message_id;
          const channelName = msg.chat.username || "jiyan_cinema";

          let responseText = "";
          if (msg.text === "/test") {
            responseText = "🚀 سيرفر Jiyan Cinema متصل بنجاح!";
          } else {
            responseText = `✅ **تم استلام محتوى جديد!**\n\n🔹 **ID الرسالة:** \`${msgId}\`\n🔗 **رابط البث:**\n\`https://my-api1.pages.dev/watch/${msgId}/${channelName}\``;
          }

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: responseText,
              parse_mode: "Markdown"
            })
          });
        }
      } catch (e) {}
      return new Response("OK");
    }

    // --- 2. قسم المكتبة المرتبة (Library API) ---
    if (path[1] === "api" && path[2] === "library") {
      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });
        const history = await client.getMessages("jiyan_cinema", { limit: 50 });
        let library = { movies: [], series: [] };

        for (const msg of history) {
          if (msg.media && msg.message) {
            const text = msg.message.toLowerCase();
            const item = {
              id: msg.id,
              title: msg.message.split('\n')[0],
              date: new Date(msg.date * 1000).toLocaleDateString()
            };
            if (text.includes("#movie")) library.movies.push(item);
            else if (text.includes("#series")) library.series.push(item);
          }
        }
        return new Response(JSON.stringify(library), {
          headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
        });
      } catch (e) { return new Response(JSON.stringify({ error: e.message })); }
    }

    // --- 3. قسم البث المباشر (Streaming) للأحجام الكبيرة 1GB+ ---
    if (path[1] === "watch" && path[2]) {
      const msgId = parseInt(path[2]);
      const channel = path[3] || "jiyan_cinema";
      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });
        const messages = await client.getMessages(channel, { ids: [msgId] });
        if (!messages || !messages[0].media) return new Response("File Not Found", { status: 404 });

        const media = messages[0].media;
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        (async () => {
          const stream = client.iterDownload({ file: media, requestSize: 512 * 1024 });
          for await (const chunk of stream) { await writer.write(chunk); }
          await writer.close();
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Accept-Ranges": "bytes",
          },
        });
      } catch (e) { return new Response("Streaming Error: " + e.message, { status: 500 }); }
    }

    return new Response("✅ Server is Up!");
  }
};
      
