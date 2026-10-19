import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  demoLogin, 
  resetPasswordForEmail, 
  signInWithOAuth 
} from '../lib/auth';
import { getSupabaseConfig } from '../lib/supabase';
import { BRAND_ASSETS } from '../data/mockData';
import { GoogleSignInModal } from './GoogleSignInModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

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

  const supabaseConfig = getSupabaseConfig();
  const isSupabaseActive = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  if (!isOpen) return null;

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

    if (!regFullName || !regEmail || !regPassword) {
      setErrorMsg('Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUpWithEmail({
        email: regEmail,
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

    if (!forgotEmail) {
      setErrorMsg('Mohon masukkan email yang terdaftar.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordForEmail(forgotEmail);
      if (res.success) {
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

  const handleGoogleLogin = () => {
    setErrorMsg(null);
    setShowGoogleModal(true);
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
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] text-white/90 font-medium">
              {isSupabaseActive ? 'Terintegrasi Supabase Cloud Auth' : 'Mode Offline'}
            </span>
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
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">error</span>
              <span>{errorMsg}</span>
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
              {/* Prominent Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 active:scale-[0.99] text-[#0e1c2f] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Masuk Cepat dengan Akun Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                  atau masuk dengan email
                </span>
              </div>

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
            {/* Prominent Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 active:scale-[0.99] text-[#0e1c2f] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Daftar Cepat Akun Agent dengan Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                atau daftar manual dengan email
              </span>
            </div>

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
                <h3 className="font-bold text-base text-[#0e1c2f]">Pemulihan Kata Sandi</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan email terdaftar Anda. Supabase Auth akan mengirimkan tautan aman untuk mengatur ulang kata sandi Anda.
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
                className="w-full py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,81,213,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Mengirim Tautan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Kirim Tautan Reset via Supabase</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Google Sign In Account Selector Modal */}
      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(user) => {
          setSuccessMsg(`Berhasil masuk dengan Akun Google: ${user.fullName}!`);
          setTimeout(() => {
            onSuccess(user);
            onClose();
          }, 600);
        }}
      />
    </div>
  );
};
