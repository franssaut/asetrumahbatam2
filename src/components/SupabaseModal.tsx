import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../lib/supabase';
import {
  getResendConfig,
  setResendConfig,
  testResendConnection,
  SUPABASE_RESET_PASSWORD_TEMPLATE_HTML,
  SUPABASE_CONFIRMATION_TEMPLATE_HTML,
  DEFAULT_RESEND_SMTP_HOST,
  DEFAULT_RESEND_SMTP_PORT,
  DEFAULT_RESEND_SMTP_USER,
  DEFAULT_RESEND_FROM_EMAIL,
  DEFAULT_RESEND_FROM_NAME,
} from '../lib/resend';
import {
  getAuthRedirectBaseUrl,
  setCustomSiteUrl,
  DEFAULT_PRODUCTION_URL,
} from '../lib/auth';

export type SupabaseModalTab = 'config' | 'schema' | 'data' | 'resend';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SupabaseModalTab;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'config',
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<SupabaseModalTab>(initialTab);
  const [localSubmissions, setLocalSubmissions] = useState<any[]>([]);

  // Resend State
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState(DEFAULT_RESEND_FROM_EMAIL);
  const [resendFromName, setResendFromName] = useState(DEFAULT_RESEND_FROM_NAME);
  const [showResendKey, setShowResendKey] = useState(false);
  const [resendTesting, setResendTesting] = useState(false);
  const [resendTestResult, setResendTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedResetTemplate, setCopiedResetTemplate] = useState(false);
  const [copiedConfirmTemplate, setCopiedConfirmTemplate] = useState(false);
  const [copiedAllSmtp, setCopiedAllSmtp] = useState(false);

  // Site & Redirect URLs State (Solusi error link email mengarah ke localhost)
  const [siteRedirectUrl, setSiteRedirectUrl] = useState(() => getAuthRedirectBaseUrl());
  const [copiedRedirectList, setCopiedRedirectList] = useState(false);
  const [copiedSiteUrl, setCopiedSiteUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);

      const rCfg = getResendConfig();
      setResendApiKey(rCfg.apiKey);
      setResendFromEmail(rCfg.fromEmail || DEFAULT_RESEND_FROM_EMAIL);
      setResendFromName(rCfg.fromName || DEFAULT_RESEND_FROM_NAME);
      setResendTestResult(null);
      setSiteRedirectUrl(getAuthRedirectBaseUrl());

      try {
        const subs = JSON.parse(localStorage.getItem('arb_local_submissions') || '[]');
        setLocalSubmissions(subs);
      } catch (e) {
        setLocalSubmissions([]);
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSupabaseConfig({ url, anonKey });
    setTestResult({ success: true, message: 'Konfigurasi kredensial Supabase berhasil disimpan!' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection({ url, anonKey });
    setTesting(false);
    setTestResult(res);
  };

  const handleSaveResend = () => {
    setResendConfig({
      apiKey: resendApiKey,
      fromEmail: resendFromEmail,
      fromName: resendFromName,
    });
    setResendTestResult({
      success: true,
      message: 'Kredensial Resend berhasil disimpan di browser! Anda sekarang dapat memasukkan konfigurasi SMTP ini ke Supabase Dashboard.',
    });
  };

  const handleTestResend = async () => {
    setResendTesting(true);
    setResendTestResult(null);
    const res = await testResendConnection(resendApiKey);
    setResendTesting(false);
    setResendTestResult(res);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const copyResetTemplate = () => {
    navigator.clipboard.writeText(SUPABASE_RESET_PASSWORD_TEMPLATE_HTML);
    setCopiedResetTemplate(true);
    setTimeout(() => setCopiedResetTemplate(false), 2500);
  };

  const copyConfirmTemplate = () => {
    navigator.clipboard.writeText(SUPABASE_CONFIRMATION_TEMPLATE_HTML);
    setCopiedConfirmTemplate(true);
    setTimeout(() => setCopiedConfirmTemplate(false), 2500);
  };

  // Ekstrak project ID dari Supabase URL untuk direct deep link
  const projectIdMatch = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  const projectId = projectIdMatch ? projectIdMatch[1] : 'ngdhaamejiuoqpppkfkq';
  const supabaseSmtpSettingsUrl = `https://supabase.com/dashboard/project/${projectId}/settings/auth`;
  const supabaseEmailTemplatesUrl = `https://supabase.com/dashboard/project/${projectId}/auth/templates`;
  const supabaseUrlConfigUrl = `https://supabase.com/dashboard/project/${projectId}/settings/auth`;

  const effectiveSiteUrl = siteRedirectUrl.trim() || DEFAULT_PRODUCTION_URL;
  const redirectUrlsList = `http://localhost:3000/**
http://localhost:3000/login?tab=reset_password
${effectiveSiteUrl}/**
${effectiveSiteUrl}/login?tab=reset_password
https://*.vercel.app/**`;

  const copyAllRedirectUrls = () => {
    navigator.clipboard.writeText(redirectUrlsList);
    setCopiedRedirectList(true);
    setTimeout(() => setCopiedRedirectList(false), 2500);
  };

  const copyAllSmtpConfig = () => {
    const summary = `=== PENGATURAN SMTP RESEND UNTUK SUPABASE AUTH ===
Host: ${DEFAULT_RESEND_SMTP_HOST}
Port: ${DEFAULT_RESEND_SMTP_PORT} (SSL) atau 587 (TLS)
Username: ${DEFAULT_RESEND_SMTP_USER}
Password: ${resendApiKey || '<Masukkan API Key Resend Anda re_...>'}
Sender Email: ${resendFromEmail || DEFAULT_RESEND_FROM_EMAIL}
Sender Name: ${resendFromName || DEFAULT_RESEND_FROM_NAME}
Link Supabase Dashboard: ${supabaseSmtpSettingsUrl}`;

    navigator.clipboard.writeText(summary);
    setCopiedAllSmtp(true);
    setTimeout(() => setCopiedAllSmtp(false), 2500);
  };

  const isConfigured = Boolean(url && anonKey && !url.includes('your-project'));
  const isResendConfigured = Boolean(resendApiKey && resendApiKey.startsWith('re_'));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 md:p-8 shadow-2xl border border-[#e5eeff] max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eff4ff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0051d5]/10 text-[#0051d5] flex items-center justify-center font-bold text-xl border border-[#0051d5]/20">
              ⚡
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0e1c2f]">
                  Integrasi Supabase & Email Resend
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConfigured ? 'Database Terhubung' : 'DB Belum Terhubung'}
                </span>
                {isResendConfigured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-[#0051d5] flex items-center gap-1">
                    <span>✉️</span> Resend Aktif
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#75777d]">
                Konfigurasi PostgreSQL database, Custom SMTP Resend (Lupa Password), dan template email.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#75777d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#eff4ff] pb-2 text-[12px] sm:text-[13px] font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-[#0e1c2f] text-white shadow-xs'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Pengaturan API
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resend')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resend'
                ? 'bg-[#0051d5] text-white shadow-xs'
                : 'text-[#0051d5] bg-blue-50/70 hover:bg-blue-100'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">mail</span>
            <span>Resend SMTP & Lupa Sandi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'schema'
                ? 'bg-[#0e1c2f] text-white shadow-xs'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Script SQL Tabel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
              activeTab === 'data'
                ? 'bg-[#0e1c2f] text-white shadow-xs'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Data Masuk ({localSubmissions.length})
          </button>
        </div>

        {/* TAB 1: PENGATURAN API SUPABASE */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0e1c2f] uppercase tracking-wider">
                Project URL Supabase
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-[#eff4ff] rounded-xl px-4 py-2.5 text-[13px] text-[#0e1c2f] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
              />
              <p className="text-[11px] text-[#75777d]">
                Didapatkan dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</em>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0e1c2f] uppercase tracking-wider">
                Project API Anon Key (Public)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#eff4ff] rounded-xl px-4 py-2.5 text-[13px] text-[#0e1c2f] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
              />
              <p className="text-[11px] text-[#75777d]">
                Didapatkan dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API Keys &gt; anon public</em>
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-[13px] flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={handleTest}
                className="w-full sm:w-auto bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] border border-[#dbe1ff] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {testing ? (
                  <span>Menguji...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>Uji Koneksi Supabase</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUrl(DEFAULT_SUPABASE_URL);
                  setAnonKey(DEFAULT_SUPABASE_ANON_KEY);
                  setSupabaseConfig({ url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY });
                  setTestResult({ success: true, message: 'Kredensial bawaan Supabase Cloud ARB telah dimuat & disimpan!' });
                }}
                className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                <span>Muat Kredensial Default ARB</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: RESEND SMTP & LUPA PASSWORD */}
        {activeTab === 'resend' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Banner Informasi Resend */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-950 text-xs sm:text-[13px] space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#0051d5] text-white flex items-center justify-center font-bold text-xs">
                  ✉️
                </span>
                <h4 className="font-bold text-sm text-[#0051d5]">
                  Integrasi Email Lupa Password via Resend (resend.com)
                </h4>
              </div>
              <p className="leading-relaxed text-blue-900/90">
                Layanan email bawaan Supabase memiliki kuota terbatas (maksimal 3 email per jam) dan sering masuk ke spam. Dengan menghubungkan <strong>Resend Custom SMTP</strong>, email reset password dan verifikasi agen akan <strong>langsung sampai dalam hitungan detik</strong> tanpa batasan kuota.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                <a
                  href="https://resend.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0051d5] hover:underline inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  <span>Daftar Akun Resend (Gratis 3.000 email/bln)</span>
                </a>
                <a
                  href={supabaseSmtpSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0e1c2f] hover:underline inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  <span>Buka Supabase Auth SMTP Settings</span>
                </a>
              </div>
            </div>

            {/* Input Resend API Key */}
            <div className="bg-[#f8faff] rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-[#0e1c2f] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">key</span>
                  <span>Resend API Key Anda</span>
                </label>
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#0051d5] font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Dapatkan API Key di Resend</span>
                  <span className="material-symbols-outlined text-[13px]">north_east</span>
                </a>
              </div>

              <div className="relative">
                <input
                  type={showResendKey ? 'text' : 'password'}
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_1234567890abcdef..."
                  className="w-full bg-white rounded-xl pl-4 pr-20 py-2.5 text-[13px] text-[#0e1c2f] font-mono border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                />
                <button
                  type="button"
                  onClick={() => setShowResendKey(!showResendKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 text-[12px] font-medium cursor-pointer"
                >
                  {showResendKey ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Sender Email (From)
                  </label>
                  <input
                    type="email"
                    value={resendFromEmail}
                    onChange={(e) => setResendFromEmail(e.target.value)}
                    placeholder="onboarding@resend.dev atau noreply@domain.com"
                    className="w-full bg-white rounded-xl px-3.5 py-2 text-[12px] text-[#0e1c2f] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Gunakan <em>onboarding@resend.dev</em> untuk uji coba cepat.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={resendFromName}
                    onChange={(e) => setResendFromName(e.target.value)}
                    placeholder="Aset Rumah Batam"
                    className="w-full bg-white rounded-xl px-3.5 py-2 text-[12px] text-[#0e1c2f] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Nama pengirim yang muncul di inbox pengguna.
                  </p>
                </div>
              </div>

              {resendTestResult && (
                <div
                  className={`p-3 rounded-xl text-[12px] flex items-start gap-2 ${
                    resendTestResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px] shrink-0 mt-0.5">
                    {resendTestResult.success ? 'check_circle' : 'error'}
                  </span>
                  <span>{resendTestResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveResend}
                  className="bg-[#0051d5] hover:bg-[#316bf3] text-white px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  Simpan Kredensial Resend
                </button>
                <button
                  type="button"
                  disabled={resendTesting || !resendApiKey}
                  onClick={handleTestResend}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resendTesting ? (
                    <span>Memeriksa API Key...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>Uji Format Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SOLUSI REDIRECT LOCALHOST / SUPABASE URL CONFIGURATION */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-amber-700 text-[22px] shrink-0 mt-0.5">
                  warning_amber
                </span>
                <div>
                  <h4 className="font-bold text-sm text-amber-950">
                    Solusi: Tautan Email Mengarah ke "localhost"
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed mt-0.5">
                    Jika email reset kata sandi mengarahkan ke <code>http://localhost:3000</code> dan tidak bisa dibuka di HP, hal ini terjadi karena <strong>Site URL &amp; Redirect URLs</strong> di Supabase Dashboard masih mengarah ke localhost.
                  </p>
                </div>
              </div>

              <div className="bg-white/95 rounded-xl p-3.5 border border-amber-200/80 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#0e1c2f] uppercase tracking-wider block">
                      Domain Website Live Anda (Site URL)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSiteRedirectUrl(DEFAULT_PRODUCTION_URL);
                        setCustomSiteUrl(DEFAULT_PRODUCTION_URL);
                        setCopiedField('reset_url_default');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="text-[10px] text-[#0051d5] hover:underline font-bold cursor-pointer"
                    >
                      {copiedField === 'reset_url_default' ? '✓ Disetel ke Default Vercel' : 'Gunakan Default Vercel'}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={siteRedirectUrl}
                      onChange={(e) => setSiteRedirectUrl(e.target.value)}
                      placeholder="https://asetrumahbatam2.vercel.app"
                      className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-[#0e1c2f] border border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSiteUrl(siteRedirectUrl);
                        setCopiedField('site_url_saved');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="bg-[#0051d5] hover:bg-[#316bf3] text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                    >
                      {copiedField === 'site_url_saved' ? '✓ Tersimpan!' : 'Simpan Domain'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0e1c2f]">Langkah Perbaikan di Supabase Dashboard:</span>
                    <a
                      href={supabaseUrlConfigUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0051d5] font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Buka URL Configuration di Supabase</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                  
                  <div className="space-y-2 text-[11px] text-gray-700">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">1. Site URL (Ubah dari localhost)</span>
                        <span className="font-mono font-bold text-[#0051d5]">{effectiveSiteUrl}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(effectiveSiteUrl, 'site_url')}
                        className="bg-white border border-gray-300 px-2 py-1 rounded text-[10px] font-bold text-gray-700 hover:text-[#0051d5] cursor-pointer"
                      >
                        {copiedField === 'site_url' ? '✓ Tersalin' : 'Salin Site URL'}
                      </button>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400">2. Redirect URLs (Masukkan allowlist)</span>
                        <button
                          type="button"
                          onClick={copyAllRedirectUrls}
                          className="bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                        >
                          {copiedRedirectList ? '✓ Semua Tersalin!' : 'Salin Daftar Redirect URLs'}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-200 p-2 rounded text-[10px] font-mono leading-relaxed overflow-x-auto">
{redirectUrlsList}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kotak Konfigurasi SMTP Supabase yang Siap Disalin */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#0e1c2f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-[#0051d5]">settings_applications</span>
                    <span>Pengaturan Custom SMTP untuk Supabase Dashboard</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Buka <strong>Supabase Dashboard &gt; Project Settings &gt; Authentication &gt; SMTP Settings</strong>, aktifkan <em>Enable Custom SMTP</em>, lalu isi:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyAllSmtpConfig}
                  className="shrink-0 bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedAllSmtp ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedAllSmtp ? 'Semua Tersalin!' : 'Salin Semua'}</span>
                </button>
              </div>

              {/* Tabel / Grid Field SMTP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Field 1: Host */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sender / Host</span>
                    <span className="font-mono font-bold text-[#0e1c2f]">{DEFAULT_RESEND_SMTP_HOST}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEFAULT_RESEND_SMTP_HOST, 'host')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer"
                    title="Salin Host"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'host' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                {/* Field 2: Port */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Port</span>
                    <span className="font-mono font-bold text-[#0e1c2f]">465 (SSL) atau 587 (TLS)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('465', 'port')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer"
                    title="Salin Port"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'port' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                {/* Field 3: User */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">User</span>
                    <span className="font-mono font-bold text-[#0e1c2f]">{DEFAULT_RESEND_SMTP_USER}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEFAULT_RESEND_SMTP_USER, 'user')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer"
                    title="Salin User"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'user' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                {/* Field 4: Password / API Key */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Password (API Key Resend)</span>
                    <span className="font-mono font-bold text-[#0e1c2f] truncate block">
                      {resendApiKey ? `${resendApiKey.slice(0, 10)}...` : '<Masukkan Resend API Key di atas>'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!resendApiKey}
                    onClick={() => copyToClipboard(resendApiKey, 'pass')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer disabled:opacity-30"
                    title="Salin Password"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'pass' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                {/* Field 5: Sender Email */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sender Email</span>
                    <span className="font-mono font-bold text-[#0e1c2f]">{resendFromEmail || DEFAULT_RESEND_FROM_EMAIL}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(resendFromEmail || DEFAULT_RESEND_FROM_EMAIL, 'sender_email')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer"
                    title="Salin Sender Email"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'sender_email' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>

                {/* Field 6: Sender Name */}
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Sender Name</span>
                    <span className="font-mono font-bold text-[#0e1c2f]">{resendFromName || DEFAULT_RESEND_FROM_NAME}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(resendFromName || DEFAULT_RESEND_FROM_NAME, 'sender_name')}
                    className="p-1 text-gray-500 hover:text-[#0051d5] cursor-pointer"
                    title="Salin Sender Name"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedField === 'sender_name' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Template Email Mewah Reset Password */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#0e1c2f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-[#0051d5]">palette</span>
                    <span>Template HTML Email Mewah ARB (Reset Password)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Tempel di <strong>Supabase Dashboard &gt; Authentication &gt; Email Templates &gt; Reset Password</strong>:
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={copyResetTemplate}
                    className="inline-flex items-center gap-1 bg-[#0051d5] hover:bg-[#316bf3] text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedResetTemplate ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedResetTemplate ? 'Template Tersalin!' : 'Salin Template HTML'}</span>
                  </button>
                  <a
                    href={supabaseEmailTemplatesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    <span>Buka Templates</span>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#0e1c2f] text-[#bac7e1] rounded-xl text-[11px] font-mono max-h-36 overflow-y-auto leading-relaxed">
                <p className="text-[#38bdf8] pb-1">
                  &lt;!-- Subject Email: Atur Ulang Kata Sandi Akun - Aset Rumah Batam --&gt;
                </p>
                {SUPABASE_RESET_PASSWORD_TEMPLATE_HTML.slice(0, 500)}...
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>Juga tersedia template konfirmasi akun agent baru:</span>
                <button
                  type="button"
                  onClick={copyConfirmTemplate}
                  className="text-[#0051d5] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {copiedConfirmTemplate ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedConfirmTemplate ? 'Tersalin!' : 'Salin Template Konfirmasi Agen'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SQL SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#44474c]">
                Jalankan script ini di <strong>Supabase Dashboard &gt; SQL Editor</strong> untuk membuat tabel otomatis:
              </p>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1 bg-[#0051d5] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#316bf3] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            <pre className="bg-[#0e1c2f] text-[#bac7e1] p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* TAB 4: DATA MASUK */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[#75777d]">
              Data pengajuan properti terbaru yang tersimpan di sistem:
            </p>

            {localSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-[#f8f9ff] rounded-xl border border-[#eff4ff] text-[#75777d] text-[13px]">
                Belum ada data pengajuan titip properti masuk.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {localSubmissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-[12px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#0e1c2f]">
                      <span>{sub.owner_name} ({sub.property_type})</span>
                      <span className="text-[#0051d5]">Rp {sub.estimated_price}</span>
                    </div>
                    <p className="text-[#75777d]">{sub.region} • {sub.address}</p>
                    <p className="text-[#44474c] text-[11px]">WA: +62 {sub.owner_whatsapp} • {sub.legal_status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[12px] text-[#75777d]">
          <span>Terintegrasi dengan Supabase SDK JS &amp; Resend SMTP</span>
          <button
            onClick={onClose}
            className="text-[#0e1c2f] hover:underline font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
