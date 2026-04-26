export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.split("/");
    const botToken = "8540355735:AAGMUlltiSfcqg1PF-VLEw39Zf4T_RqiJnU";

    // 1. مسار استخراج الـ ID (افتح هذا المسار في المتصفح بعد إرسال الفيديو للبوت)
    if (path[1] === "getid") {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
        const data = await response.json();
        return new Response(JSON.stringify(data, null, 2), {
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      } catch (e) {
        return new Response("خطأ في الاتصال بتليجرام");
      }
    }

    // 2. مسار بث الفيديو (Stream)
    if (path[1] === "watch" && path[2]) {
      const fileId = path[2]; // الـ File ID الذي ستحصل عليه من مسار getid

      try {
        // جلب مسار الملف المباشر من تليجرام
        const getFile = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
        const fileData = await getFile.json();

        if (!fileData.ok) {
          return new Response("خطأ: الـ File ID غير صحيح أو الملف منتهي الصلاحية", { status: 400 });
        }

        const filePath = fileData.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // طلب الفيديو من تليجرام وتمريره كـ Stream (يدعم التقديم والتأخير)
        const videoResponse = await fetch(downloadUrl, {
          headers: request.headers // تمرير الـ Range لدعم المشغل
        });

        // إرجاع الفيديو مع الهيدرز المناسبة للبث
        return new Response(videoResponse.body, {
          headers: {
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Accept-Ranges": "bytes",
            "Content-Length": videoResponse.headers.get("Content-Length")
          },
        });
      } catch (e) {
        return new Response("حدث خطأ تقني: " + e.message, { status: 500 });
      }
    }

    // 3. الصفحة الرئيسية الافتراضية
    return new Response("✅ خادم Jiyan Cinema يعمل بنجاح!");
  }
};
      
