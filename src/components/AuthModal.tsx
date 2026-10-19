import React, { useState } from 'react';
import { UserProfile } from '../types';
import { signInWithEmail, signUpWithEmail, demoLogin } from '../lib/auth';
import { BRAND_ASSETS } from '../data/mockData';

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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserProfile['role']>('klien');

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
        setSuccessMsg(`Pendaftaran berhasil! Selamat datang, ${res.user.fullName}.`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message || 'Gagal mendaftar. Silakan coba kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pendaftaran.');
    } finally {
      setLoading(false);
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

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mb-3 ring-1 ring-white/20">
            <img
              src={BRAND_ASSETS.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Portal Akun Aset Rumah Batam
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Akses listing eksklusif, kelola titip properti, dan pantau status legalitas UWTO
          </p>

          {/* Tab Selector */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
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
              Daftar Baru
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
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
                    onClick={() => alert('Fitur reset kata sandi dikirim via email Supabase terdaftar.')}
                    className="text-xs text-[#0051d5] hover:underline font-medium"
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
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>

              {/* 1-Click Demo Login Shortcuts */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">bolt</span>
                  <p className="text-xs font-bold text-[#0e1c2f]">
                    Uji Coba Cepat 1-Klik (Akun Demo):
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoClick('klien')}
                    className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Klien</span>
                      <span className="material-symbols-outlined text-blue-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0e1c2f] mt-1 line-clamp-1">Budi Santoso</p>
                    <p className="text-[10px] text-gray-500">Pembeli Prioritas</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('agen')}
                    className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60 hover:border-emerald-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Agen</span>
                      <span className="material-symbols-outlined text-emerald-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0e1c2f] mt-1 line-clamp-1">Hendra Wijaya</p>
                    <p className="text-[10px] text-gray-500">Konsultan Senior</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('investor')}
                    className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Investor</span>
                      <span className="material-symbols-outlined text-purple-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0e1c2f] mt-1 line-clamp-1">Michael Tan</p>
                    <p className="text-[10px] text-gray-500">Singapore/Global</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoClick('admin')}
                    className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/60 hover:border-rose-300 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Admin</span>
                      <span className="material-symbols-outlined text-rose-600 text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0e1c2f] mt-1 line-clamp-1">Admin Utama</p>
                    <p className="text-[10px] text-gray-500">Full Dashboard</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
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
                  Email Aktif *
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

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5 uppercase tracking-wider">
                  Peran / Kategori Akun
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('klien')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regRole === 'klien'
                        ? 'border-[#0051d5] bg-[#eff4ff] text-[#0051d5] font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs">👤 Klien</span>
                    <span className="text-[10px] text-gray-500 font-normal">Pembeli / Penjual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('agen')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regRole === 'agen'
                        ? 'border-[#0051d5] bg-[#eff4ff] text-[#0051d5] font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs">👔 Agen</span>
                    <span className="text-[10px] text-gray-500 font-normal">Broker Properti</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('investor')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      regRole === 'investor'
                        ? 'border-[#0051d5] bg-[#eff4ff] text-[#0051d5] font-bold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-xs">💼 Investor</span>
                    <span className="text-[10px] text-gray-500 font-normal">Pemodal / Aset</span>
                  </button>
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

              <div className="text-[11px] text-gray-500 leading-relaxed">
                Dengan mendaftar, Anda menyetujui Ketentuan Layanan, Kebijakan Privasi, dan verifikasi akun Aset Rumah Batam.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-[0.99] text-white font-bold text-sm shadow-[0_4px_16px_rgba(0,81,213,0.25)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Buat Akun Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
