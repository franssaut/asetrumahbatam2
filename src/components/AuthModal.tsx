import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  demoLogin, 
  resetPasswordForEmail, 
  resendConfirmationEmail,
  checkEmailExists
} from '../lib/auth';
import { getSupabaseConfig } from '../lib/supabase';
import { BRAND_ASSETS } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialTab?: 'login' | 'register';
  onOpenSupabaseModal?: (tab?: 'config' | 'schema' | 'data' | 'resend') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
  onOpenSupabaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserProfile['role']>('agent');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(1);

  const supabaseConfig = getSupabaseConfig();
  const isSupabaseActive = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Timer countdown untuk resend forgot password
  React.useEffect(() => {
    let timer: any = null;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  if (!isOpen) return null;

  const handleResendConfirmation = async () => {
    const targetEmail = loginEmail || regEmail;
    if (!targetEmail) {
      setErrorMsg('Mohon masukkan email Anda terlebih dahulu.');
      return;
    }
    setResending(true);
    setErrorMsg(null);
    try {
      const res = await resendConfirmationEmail(targetEmail);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email konfirmasi.');
    } finally {
      setResending(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Mohon isi email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmail(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMsg(`Selamat datang kembali, ${res.user.fullName}!`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!regFullName || !cleanEmail || !regPassword) {
      setErrorMsg('Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      // Periksa apakah email sudah terdaftar
      const check = await checkEmailExists(cleanEmail);
      if (check.exists) {
        setErrorMsg(check.message || 'Email ini sudah terdaftar. Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan langsung masuk di tab Masuk Akun.');
        setLoading(false);
        return;
      }

      const res = await signUpWithEmail({
        email: cleanEmail,
        password: regPassword,
        fullName: regFullName,
        phone: regPhone,
        role: regRole,
      });

      if (res.success && res.user) {
        setSuccessMsg(res.message || `Pendaftaran berhasil di Supabase! Selamat datang, ${res.user.fullName}.`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 900);
      } else {
        setErrorMsg(res.message || 'Gagal mendaftar. Silakan coba kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = forgotEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setErrorMsg('Mohon masukkan format email yang valid.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordForEmail(clean);
      if (res.success) {
        setForgotSent(true);
        setResendCountdown(60);
        setResendCount(1);
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses pemulihan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgot = async () => {
    if (resendCountdown > 0 || resending) return;
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setErrorMsg('Mohon isi alamat email terlebih dahulu.');
      return;
    }

    setResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await resetPasswordForEmail(clean);
      if (res.success) {
        setResendCount((prev) => prev + 1);
        setResendCountdown(60);
        setSuccessMsg(`Tautan pemulihan baru berhasil dikirim ulang ke ${clean}! Periksa kotak masuk atau spam.`);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email pemulihan.');
    } finally {
      setResending(false);
    }
  };

  const handleDemoClick = (role: UserProfile['role']) => {
    setErrorMsg(null);
    const user = demoLogin(role);
    setSuccessMsg(`Berhasil masuk sebagai demo: ${user.fullName} (${role.toUpperCase()})`);
    setTimeout(() => {
      onSuccess(user);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#eff4ff] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-[#0e1c2f] via-[#10243e] to-[#0051d5] p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mb-2 ring-1 ring-white/20">
            <img
              src={BRAND_ASSETS.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Portal Akun Aset Rumah Batam
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] text-white/90 font-medium">
              {isSupabaseActive ? 'Supabase Auth Cloud Terhubung' : 'Mode Offline'}
            </span>
            {onOpenSupabaseModal && (
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="text-[10px] bg-white/15 hover:bg-white/25 text-white font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 border border-white/20"
                title="Buka status koneksi & script SQL Supabase"
              >
                <span>Status & SQL</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#0e1c2f] shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-[#0e1c2f] shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Daftar Baru (Agent)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">error</span>
              <div className="flex-1 min-w-0">
                <p>{errorMsg}</p>
                {errorMsg.toLowerCase().includes('sudah terdaftar') && (
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(regEmail);
                      setActiveTab('login');
                      setErrorMsg(null);
                    }}
                    className="mt-2 text-xs font-bold text-white bg-[#0051d5] hover:bg-[#316bf3] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">login</span>
                    <span>Beralih ke Tab Masuk Akun</span>
                  </button>
                )}
                {(errorMsg.includes('dikonfirmasi') || errorMsg.includes('not confirmed')) && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-2 text-xs font-bold text-[#0051d5] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>{resending ? 'Mengirim...' : 'Kirim Ulang Tautan Konfirmasi Email'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0e1c2f] uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-[#0051d5] hover:underline font-medium cursor-pointer"
                    >
                      Lupa sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,81,213,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Memverifikasi Supabase Auth...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Masuk ke Akun Supabase</span>
                    </>
                  )}
                </button>

                {/* 1-Click Demo Login Shortcuts */}
                <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">bolt</span>
                  <p className="text-xs font-bold text-[#0e1c2f]">
                    Uji Coba Cepat 1-Klik (Akun Demo):
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDemoClick('agent')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">👔 Agent</span>
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-bold text-[#0e1c2f] mt-1.5 line-clamp-1">Hendra Wijaya</p>
                    <p className="text-[10px] text-gray-500">Konsultan Agent Properti</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('admin')}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 hover:border-rose-400 transition-all text-left group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">🛡️ Admin</span>
                      <span className="material-symbols-outlined text-rose-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-bold text-[#0e1c2f] mt-1.5 line-clamp-1">Admin Utama ARB</p>
                    <p className="text-[10px] text-gray-500">Full Akses Kelola Portal</p>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  Nama Lengkap *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Contoh: Andi Pratama"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  Email Aktif (Supabase Auth) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  No. WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    phone
                  </span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Peran Akun: Khusus Agent Properti */}
              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  Peran Akun Pendaftar Baru
                </label>
                <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/70 flex items-start sm:items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-emerald-950">👔 Agent Properti</span>
                      <span className="text-[10px] bg-emerald-200/90 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Resmi</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                      Pendaftaran akun baru dikhususkan untuk <strong>Agent Properti</strong> untuk mengunggah dan mengelola listing properti di Batam. (Akun Admin dikelola internal oleh sistem).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  Kata Sandi Baru *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,81,213,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Mendaftarkan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Daftarkan Akun Agent ke Supabase</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {!forgotSent ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#0051d5] font-semibold hover:underline cursor-pointer mb-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      Kembali ke Masuk Akun
                    </button>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-[#0e1c2f]">Pemulihan Kata Sandi</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-[#0051d5] text-[10px] font-bold">
                        <span>✉️</span> Resend SMTP
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Masukkan email terdaftar Anda. Supabase Auth didukung infrastruktur <strong>Resend</strong> akan mengirimkan tautan aman untuk mengatur ulang kata sandi Anda.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                      Email Akun Supabase
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[#0e1c2f] text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,81,213,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Mengirim Tautan...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>Kirim Tautan Reset via Resend</span>
                      </>
                    )}
                  </button>

                  {onOpenSupabaseModal && (
                    <div className="pt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Pengiriman bebas kuota via Resend</span>
                      <button
                        type="button"
                        onClick={() => onOpenSupabaseModal('resend')}
                        className="text-[#0051d5] hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Panduan Resend SMTP</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[22px]">mark_email_read</span>
                      <p className="font-bold text-sm text-emerald-950">Tautan Pemulihan Terkirim!</p>
                    </div>
                    <p className="leading-relaxed text-emerald-800">
                      Tautan aman pemulihan sandi telah dikirim ke: <strong className="text-emerald-950">{forgotEmail}</strong> melalui infrastruktur Resend SMTP.
                      Silakan periksa kotak masuk utama atau spam email Anda.
                    </p>
                    <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Terkirim {resendCount > 1 ? `(${resendCount} kali)` : '1 kali'}</span>
                    </div>
                  </div>

                  {/* Resend Panel dengan Timer */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Belum menerima email pemulihan?</span>
                      {resendCountdown > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                          {resendCountdown}s
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={resending || resendCountdown > 0}
                        onClick={handleResendForgot}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          resendCountdown > 0 || resending
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#0051d5] hover:bg-[#316bf3] text-white active:scale-95'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[16px] ${resending ? 'animate-spin' : ''}`}>
                          {resending ? 'progress_activity' : 'forward_to_inbox'}
                        </span>
                        <span>
                          {resending
                            ? 'Mengirim Ulang...'
                            : resendCountdown > 0
                            ? `Kirim Ulang (${resendCountdown}s)`
                            : 'Kirim Ulang Tautan'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotSent(false);
                          setErrorMsg(null);
                        }}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Ganti Email</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-gray-600 hover:text-[#0051d5] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                      <span>Kembali ke Masuk Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
