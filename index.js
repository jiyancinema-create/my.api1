const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");

// البيانات الخاصة بك (مستخرجة من الصورة والتوكن الجديد)
const apiId = 30651243;
const apiHash = "86710fa8e842c940797295416cc0e418";
const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";

const stringSession = new StringSession(""); 
const app = express();

// إنشاء العميل (الجسر بين سيرفرك وتليجرام)
const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

(async () => {
    // تشغيل البوت باستخدام نظام الـ Bot Auth داخل بروتوكول MTProto لتجاوز القيود
    await client.start({
        botAuthToken: botToken,
    });
    console.log("✅ Jiyan Cinema Server is Live!");
})();

// مسار البث المباشر (للمشاهدة من داخل تطبيق Expo)
app.get('/watch/:msgId/:chatId', async (req, res) => {
    try {
        const { msgId, chatId } = req.params;
        
        // جلب الرسالة التي تحتوي على الفيلم
        const messages = await client.getMessages(chatId, { ids: [parseInt(msgId)] });
        
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("الفيديو غير موجود، تأكد من الـ ID");
        }

        const media = messages[0].media;
        
        // إعداد البث لدعم التقديم والتأخير (Range Support) لملفات 1GB+
        res.setHeader("Content-Type", "video/mp4");
        
        const stream = client.iterDownload({
            file: media,
            requestSize: 1024 * 1024, // ضخ 1 ميجا في كل نبضة لضمان عدم التقطيع
        });

        for await (const chunk of stream) {
            res.write(chunk);
        }
        res.end();

    } catch (e) {
        console.error("Streaming Error:", e.message);
        res.status(500).send("حدث خطأ أثناء بث الفيلم");
    }
});

// صفحة فحص حالة السيرفر
app.get('/', (req, res) => res.send("سيرفر Jiyan Cinema يعمل بنجاح على التوكن الجديد!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
