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
    const path = url.pathname.split("/");

    // --- نظام الـ Webhook (استقبال البيانات) ---
    if (request.method === "POST" && path[1] === "webhook") {
      try {
        const update = await request.json();
        
        // جلب الرسالة سواء من قناة أو دردشة
        const msg = update.channel_post || update.message;

        if (msg) {
          const chatId = msg.chat.id;
          const msgId = msg.message_id;
          const channelName = msg.chat.username || "jiyan_cinema";

          // رد تلقائي على أي فيديو أو ملف
          if (msg.video || msg.document || msg.text === "/test") {
            let text = "";
            if (msg.text === "/test") {
              text = "🚀 **السيرفر شغال والبوت يسمعك الآن!**";
            } else {
              text = `✅ **تم رصد محتوى جديد!**\n\n🔹 **ID:** \`${msgId}\`\n🔗 **رابط البث:**\n\`https://my-api1.pages.dev/watch/${msgId}/${channelName}\``;
            }

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "Markdown"
              })
            });
          }
        }
      } catch (e) {
        // إذا حدث خطأ في الكود، سيرسل لك البوت رسالة بالخطأ (للفحص)
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: 8540355735, text: "❌ خطأ برميجي: " + e.message })
        });
      }
      return new Response("OK");
    }

    // --- نظام البث (Streaming) ---
    if (path[1] === "watch" && path[2]) {
      const msgId = parseInt(path[2]);
      const channel = path[3] || "jiyan_cinema";
      try {
        if (!client.connected) await client.start({ botAuthToken: botToken });
        const messages = await client.getMessages(channel, { ids: [msgId] });
        if (!messages || !messages[0].media) return new Response("Not Found", { status: 404 });

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        (async () => {
          const stream = client.iterDownload({ file: messages[0].media, requestSize: 512 * 1024 });
          for await (const chunk of stream) { await writer.write(chunk); }
          await writer.close();
        })();

        return new Response(readable, {
          headers: { "Content-Type": "video/mp4", "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" }
        });
      } catch (e) { return new Response("Error: " + e.message); }
    }

    return new Response("✅ Jiyan Cinema Online");
  }
};
                                
