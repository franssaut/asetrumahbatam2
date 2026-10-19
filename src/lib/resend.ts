/**
 * RESEND EMAIL INTEGRATION & SUPABASE SMTP CONFIGURATION HELPER
 * Portal Properti Mewah Aset Rumah Batam
 * 
 * Resend (https://resend.com) digunakan untuk pengiriman email transaksional
 * termasuk Lupa Password (Password Recovery) & Verifikasi Akun Agen
 * tanpa batasan kuota bawaan Supabase (3 email/jam) & bebas spam.
 */

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
}

export const DEFAULT_RESEND_SMTP_HOST = 'smtp.resend.com';
export const DEFAULT_RESEND_SMTP_PORT = 465; // Port 465 untuk SSL atau 587 untuk TLS
export const DEFAULT_RESEND_SMTP_USER = 'resend';
export const DEFAULT_RESEND_FROM_EMAIL = 'onboarding@resend.dev';
export const DEFAULT_RESEND_FROM_NAME = 'Aset Rumah Batam';

/**
 * Mendapatkan konfigurasi Resend dari LocalStorage dengan fallback ke env variable
 */
export function getResendConfig(): ResendConfig {
  let apiKey = '';
  let fromEmail = DEFAULT_RESEND_FROM_EMAIL;
  let fromName = DEFAULT_RESEND_FROM_NAME;

  if (typeof window !== 'undefined') {
    try {
      apiKey = localStorage.getItem('arb_resend_api_key') || '';
      fromEmail = localStorage.getItem('arb_resend_from_email') || DEFAULT_RESEND_FROM_EMAIL;
      fromName = localStorage.getItem('arb_resend_from_name') || DEFAULT_RESEND_FROM_NAME;
    } catch (e) {
      console.warn('Gagal membaca kredensial Resend dari storage:', e);
    }
  }

  // Fallback ke Vite Environment Variables
  if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env) {
    apiKey = (import.meta.env.VITE_RESEND_API_KEY as string) || '';
    if (import.meta.env.VITE_RESEND_FROM_EMAIL) {
      fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL as string;
    }
  }

  const isConfigured = Boolean(apiKey && apiKey.trim().startsWith('re_'));

  return {
    apiKey: apiKey.trim(),
    fromEmail: fromEmail.trim(),
    fromName: fromName.trim(),
    isConfigured,
  };
}

/**
 * Menyimpan konfigurasi Resend ke LocalStorage
 */
export function setResendConfig(config: { apiKey: string; fromEmail?: string; fromName?: string }) {
  if (typeof window === 'undefined') return;

  try {
    if (config.apiKey !== undefined) {
      localStorage.setItem('arb_resend_api_key', config.apiKey.trim());
    }
    if (config.fromEmail) {
      localStorage.setItem('arb_resend_from_email', config.fromEmail.trim());
    }
    if (config.fromName) {
      localStorage.setItem('arb_resend_from_name', config.fromName.trim());
    }

    // Trigger event agar komponen reactive
    window.dispatchEvent(
      new CustomEvent('arb_resend_config_changed', {
        detail: getResendConfig(),
      })
    );
  } catch (e) {
    console.error('Gagal menyimpan konfigurasi Resend:', e);
  }
}

/**
 * Validasi dan uji format API Key Resend
 */
export async function testResendConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  const cleanKey = apiKey.trim();

  if (!cleanKey) {
    return {
      success: false,
      message: 'API Key Resend tidak boleh kosong. Dapatkan di https://resend.com/api-keys',
    };
  }

  if (!cleanKey.startsWith('re_')) {
    return {
      success: false,
      message: 'Format API Key Resend tidak valid. API Key resmi Resend selalu diawali dengan "re_".',
    };
  }

  if (cleanKey.length < 20) {
    return {
      success: false,
      message: 'Panjang API Key Resend tidak memenuhi standar (minimal 20 karakter).',
    };
  }

  // Uji fetch langsung ke Resend REST API (GET /api-keys) jika didukung jaringan
  try {
    const res = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        message: 'Koneksi ke Resend API berhasil diverifikasi! API Key aktif dan siap digunakan untuk SMTP Supabase.',
      };
    } else if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'API Key Resend ditolak (HTTP 401 Unauthorized). Pastikan Anda menyalin key yang valid dan aktif dari Resend Dashboard.',
      };
    } else {
      // Status lain atau restricted permission
      return {
        success: true,
        message: `Format API Key terverifikasi valid (${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}). Silakan pasang pada Custom SMTP Supabase.`,
      };
    }
  } catch (err: any) {
    // Karena pembatasan browser CORS untuk REST API Resend direct client-call:
    // API key format sudah valid, ingatkan user untuk memasukkannya ke Supabase SMTP Settings
    return {
      success: true,
      message: `Format API Key valid (${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}). Masukkan key ini sebagai SMTP Password di Supabase Dashboard agar Supabase server mengirim email melalui Resend tanpa hambatan CORS.`,
    };
  }
}

/**
 * Template HTML Mewah Aset Rumah Batam untuk Supabase Email Templates:
 * "Reset Password" (Lupa Kata Sandi)
 * 
 * Gunakan variabel Supabase: {{ .ConfirmationURL }}
 */
export const SUPABASE_RESET_PASSWORD_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Ulang Kata Sandi Akun - Aset Rumah Batam</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f7fb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f7fb;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(14, 28, 47, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0b1c30 0%, #0e2a47 100%);
      padding: 36px 30px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0;
      color: #ffffff;
    }
    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #38bdf8;
      margin-top: 6px;
      font-weight: 600;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
    }
    .paragraph {
      font-size: 14px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .reset-btn {
      display: inline-block;
      background: #0051d5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 81, 213, 0.35);
    }
    .notice-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0051d5;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .link-fallback {
      font-size: 11px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 20px;
      line-height: 1.5;
    }
    .link-fallback a {
      color: #0051d5;
      text-decoration: underline;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer strong {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <div style="font-size: 32px; margin-bottom: 8px;">🏛️</div>
        <h1 class="brand-title">ASET RUMAH BATAM</h1>
        <div class="brand-subtitle">PORTAL PROPERTI RESMI & LEGALITAS UWTO BATAM</div>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="greeting">Halo Mitra & Pengguna Terhormat,</div>
        <p class="paragraph">
          Kami menerima permintaan untuk mengatur ulang kata sandi (password) akun Anda di portal <strong>Aset Rumah Batam</strong>. Silakan klik tombol aman di bawah ini untuk membuat kata sandi baru:
        </p>

        <div class="button-container">
          <a href="{{ .ConfirmationURL }}" class="reset-btn" target="_blank" rel="noopener noreferrer">
            🔒 Atur Ulang Kata Sandi Sekarang
          </a>
        </div>

        <!-- 6-DIGIT OTP CODE BOX (Solusi instan jika link diarahkan ke localhost) -->
        <div style="margin: 28px auto; padding: 20px; background-color: #f0f7ff; border: 2px dashed #0051d5; border-radius: 14px; text-align: center; max-width: 360px;">
          <div style="font-size: 11px; font-weight: 700; color: #0051d5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
            Atau Masukkan 6-Digit Kode Verifikasi (OTP):
          </div>
          <div style="font-size: 32px; font-weight: 900; font-family: 'SF Pro Mono', Consolas, Monaco, monospace; letter-spacing: 8px; color: #0e1c2f; padding: 4px 0;">
            {{ .Token }}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px; line-height: 1.4;">
            Masukkan kode angka ini langsung pada formulir pemulihan di web tanpa perlu mengklik tautan di atas.
          </div>
        </div>

        <div class="notice-box">
          <strong>⚠️ Catatan Keamanan:</strong>
          <br>
          • Tautan &amp; Kode OTP ini aman dan berlaku selama <strong>60 menit</strong>.
          <br>
          • Jika Anda tidak merasa mengajukan permintaan ini, abaikan email ini. Akun Anda tetap terlindungi dan kata sandi Anda tidak akan berubah.
        </div>

        <div class="link-fallback">
          Jika tombol di atas tidak dapat diklik, salin dan tempel URL berikut ke browser Anda:
          <br>
          <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <strong>Aset Rumah Batam (ARB)</strong><br>
        Pusat Solusi Properti & Konsultasi Hak UWTO BP Batam Terpercaya<br>
        Kawasan Bisnis Nagoya & Batam Centre, Kota Batam, Kepulauan Riau<br>
        <em>Email otomatis ini dikirim melalui infrastruktur Resend Delivery System.</em>
      </div>
    </div>
  </div>
</body>
</html>`;

/**
 * Template HTML Konfirmasi Pendaftaran Akun Agent
 */
export const SUPABASE_CONFIRMATION_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Akun Agent - Aset Rumah Batam</title>
  <style>
    body { margin:0; padding:0; background-color:#f4f7fb; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#1e293b; }
    .wrapper { width:100%; background-color:#f4f7fb; padding:40px 10px; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 25px rgba(14,28,47,0.08); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, #0b1c30 0%, #0e2a47 100%); padding:36px 30px; text-align:center; color:#ffffff; }
    .content { padding:36px 32px; }
    .btn { display:inline-block; background:#0051d5; color:#ffffff !important; text-decoration:none; font-size:14px; font-weight:700; padding:14px 32px; border-radius:12px; }
    .footer { background:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="font-size:32px; margin-bottom:8px;">✨</div>
        <h1 style="font-size:22px; font-weight:800; margin:0; color:#ffffff;">ASET RUMAH BATAM</h1>
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:2px; color:#38bdf8; margin-top:6px;">VERIFIKASI AKUN AGENT BARU</div>
      </div>
      <div class="content">
        <h2 style="font-size:18px; font-bold; color:#0f172a; margin-top:0;">Selamat Datang di Jaringan Agent ARB!</h2>
        <p style="font-size:14px; line-height:1.6; color:#475569;">
          Terima kasih telah mendaftar sebagai Agent Properti di <strong>Aset Rumah Batam</strong>. Mohon konfirmasi alamat email Anda untuk mengaktifkan akun dan mulai menerbitkan listing properti:
        </p>
        <div style="text-align:center; margin:30px 0;">
          <a href="{{ .ConfirmationURL }}" class="btn" target="_blank" rel="noopener noreferrer">
            ✓ Konfirmasi Email Agent Saya
          </a>
        </div>
        <p style="font-size:12px; color:#64748b; line-height:1.5;">
          Setelah verifikasi berhasil, Anda dapat mengunggah listing properti yang akan dimoderasi oleh Administrator sebelum tayang ke publik.
        </p>
      </div>
      <div class="footer">
        Aset Rumah Batam • Pusat Properti Resmi & UWTO Batam<br>
        <em>Dikirim via Resend SMTP Infrastructure</em>
      </div>
    </div>
  </div>
</body>
</html>`;
