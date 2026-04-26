export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");

    if (path[1] === "watch") {
      const msgId = path[2];
      const chatId = path[3];
      const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";

      try {
        // 1. جلب مسار الملف من تليجرام باستخدام الـ API الرسمي
        // سنستخدم chatId لجلب الملف (يجب أن يكون البوت أدمن)
        const getFileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${msgId}`);
        const fileData = await getFileResponse.json();

        if (!fileData.ok) {
          return new Response("خطأ: تأكد من أن الـ File ID صحيح والبوت أدمن", { status: 400 });
        }

        const filePath = fileData.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // 2. تمرير الفيديو كـ Stream لدعم الأحجام الكبيرة (1GB+)
        const videoResponse = await fetch(downloadUrl);

        return new Response(videoResponse.body, {
          headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Content-Disposition": "inline"
          },
        });

      } catch (e) {
        return new Response("حدث خطأ في الاتصال: " + e.message, { status: 500 });
      }
    }

    return new Response("✅ سيرفر Jiyan Cinema جاهز!", { status: 200 });
  }
};
