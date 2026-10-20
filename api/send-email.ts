// api/send-email.ts
// Vercel Serverless Function for sending transactional emails via Resend.com
// This eliminates Supabase email rate limits and browser CORS issues.

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Gunakan metode POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { to, subject, html, text, from, apiKey } = body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Alamat tujuan (to) wajib diisi.' });
    }

    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subjek email wajib diisi.' });
    }

    if (!html && !text) {
      return res.status(400).json({ success: false, message: 'Isi konten email (html atau text) wajib diisi.' });
    }

    // Ambil API Key dari request body, env RESEND_API_KEY, atau VITE_RESEND_API_KEY
    const resendApiKey = apiKey || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!resendApiKey || !resendApiKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Resend API Key belum disetel. Masukkan API Key Resend di modal pengaturan atau variabel RESEND_API_KEY di Vercel.',
      });
    }

    const cleanKey = resendApiKey.trim();
    if (!cleanKey.startsWith('re_')) {
      return res.status(400).json({
        success: false,
        message: 'Format Resend API Key tidak valid (harus diawali dengan "re_").',
      });
    }

    const sender = from || 'Aset Rumah Batam <onboarding@resend.dev>';
    console.log(`[Resend Vercel API] Mengirim email ke: ${to} | Dari: ${sender} | Subjek: ${subject}`);

    // Kirim request ke Resend REST API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    });

    const data = await resendResponse.json();
    console.log(`[Resend Vercel API] Respon status: ${resendResponse.status}`, data);

    if (!resendResponse.ok) {
      return res.status(resendResponse.status).json({
        success: false,
        message: data.message || 'Resend API menolak pengiriman email.',
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email berhasil dikirim langsung via Resend.com!',
      id: data.id,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan pada server saat mengirim email via Resend.',
    });
  }
}
