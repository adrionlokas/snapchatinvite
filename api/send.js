// api/send.js
import { formidable } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // نغلق الـ body parser الافتراضي لأننا سنستقبل صورة (FormData)
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const photoNumber = fields.photoNumber?.[0] || '1';
    const caption = fields.caption?.[0] || '';

    // جلب ملف الصورة المرفوع
    const file = files.photo?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    try {
      const telegramFormData = new FormData();
      telegramFormData.append('chat_id', chatId);
      
      // تحويل الملف المؤقت إلى Blob لإرساله إلى تيليجرام
      const fileBuffer = fs.readFileSync(file.filepath);
      const blob = new Blob([fileBuffer], { type: file.mimetype });
      telegramFormData.append('photo', blob, file.originalFilename);
      telegramFormData.append('caption', caption);

      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: telegramFormData,
      });

      const result = await telegramResponse.json();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}