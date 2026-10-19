import React, { useState, useEffect } from 'react';
import { PageId, UserProfile } from '../types';
import { BRAND_ASSETS } from '../data/mockData';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  demoLogin, 
  resetPasswordForEmail, 
  resendConfirmationEmail,
  checkEmailExists,
  updateUserPassword
} from '../lib/auth';
import { getSupabaseConfig } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (page: PageId) => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onOpenSupabaseModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  currentUser,
  onLoginSuccess,
  onLogout,
  onOpenSupabaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot' | 'reset_password'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExistsWarning, setEmailExistsWarning] = useState<string | null>(null);

  // Forgot Password & Resend State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(1);

  // Set New Password State (after clicking reset link)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const supabaseConfig = getSupabaseConfig();
  const isSupabaseActive = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Cooldown countdown timer for resending reset email
  useEffect(() => {
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

  // Check URL query parameters and recovery hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const hash = window.location.hash.toLowerCase();

      if (tabParam === 'register' || tabParam === 'daftar') {
        setActiveTab('register');
      } else if (tabParam === 'forgot' || tabParam === 'lupasandi') {
        setActiveTab('forgot');
      } else if (
        tabParam === 'reset_password' || 
        tabParam === 'reset' || 
        hash.includes('type=recovery') ||
        hash.includes('access_token=') && hash.includes('recovery')
      ) {
        setActiveTab('reset_password');
        setSuccessMsg('Sesi pemulihan kata sandi aktif. Silakan masukkan kata sandi baru Anda.');
      }

      // Listen for Supabase password recovery event
      const handlePasswordRecovery = () => {
        setActiveTab('reset_password');
        setSuccessMsg('Tautan verifikasi email berhasil diverifikasi. Silakan masukkan kata sandi baru Anda.');
      };

      window.addEventListener('arb_password_recovery', handlePasswordRecovery);
      return () => {
        window.removeEventListener('arb_password_recovery', handlePasswordRecovery);
      };
    }
  }, []);

  const handleClearAlerts = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchTab = (tab: 'login' | 'register' | 'forgot' | 'reset_password') => {
    handleClearAlerts();
    if (tab === 'forgot' && !forgotEmail && loginEmail) {
      setForgotEmail(loginEmail);
    }
    setActiveTab(tab);
  };

  const handleRegEmailBlur = async () => {
    const clean = regEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailExistsWarning(null);
      return;
    }
    setEmailCheckLoading(true);
    try {
      const check = await checkEmailExists(clean);
      if (check.exists) {
        setEmailExistsWarning(check.message || 'Email ini sudah terdaftar. Anda tidak dapat mendaftar lagi dengan email yang sama.');
      } else {
        setEmailExistsWarning(null);
      }
    } catch (e) {
      setEmailExistsWarning(null);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearAlerts();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Mohon lengkapi email dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmail(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMsg(`Selamat datang kembali, ${res.user.fullName}!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setErrorMsg(res.message || 'Email atau kata sandi tidak cocok.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses login.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register (Strictly Agent Role - Reject Duplicates)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearAlerts();

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!regFullName.trim() || !cleanEmail || !regPassword) {
      setErrorMsg('Mohon lengkapi nama, email, dan kata sandi.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter demi keamanan akun Anda.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok. Mohon teliti kembali.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Mohon setujui ketentuan dan kode etik Agent Properti Batam.');
      return;
    }

    setLoading(true);
    try {
      // Periksa apakah email sudah terdaftar terlebih dahulu
      const emailCheck = await checkEmailExists(cleanEmail);
      if (emailCheck.exists) {
        const warn = emailCheck.message || 'Email ini sudah terdaftar. Anda tidak dapat mendaftar lagi dengan email ini.';
        setEmailExistsWarning(warn);
        setErrorMsg(warn + ' Silakan langsung beralih ke tab Masuk Akun.');
        setLoading(false);
        return;
      }

      const res = await signUpWithEmail({
        email: cleanEmail,
        password: regPassword,
        fullName: regFullName,
        phone: regPhone,
        role: 'agent', // Strictly agent
      });

      if (res.success && res.user) {
        if (res.needsVerification) {
          setSuccessMsg(
            `Pendaftaran berhasil! Akun Agent Anda telah dibuat di Supabase Auth. ${res.message || 'Tautan konfirmasi telah dikirim ke email.'}`
          );
        } else {
          setSuccessMsg(`Pendaftaran Agent berhasil! Selamat datang, ${res.user.fullName}.`);
        }

        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 1200);
      } else {
        const isDuplicate = 
          res.message?.toLowerCase().includes('sudah terdaftar') || 
          res.message?.toLowerCase().includes('already registered') ||
          res.message?.toLowerCase().includes('already exists');

        if (isDuplicate) {
          setEmailExistsWarning('Email ini sudah terdaftar di sistem.');
        }
        setErrorMsg(res.message || 'Pendaftaran gagal. Silakan coba kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password (Kirim Tautan Pertama Kali)
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearAlerts();

    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      setErrorMsg('Mohon masukkan alamat email yang valid.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordForEmail(targetEmail);
      if (res.success) {
        setForgotSent(true);
        setResendCountdown(60);
        setResendCount(1);
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Resend Forgot Password Email (Kirim Ulang Tautan)
  const handleResendForgot = async () => {
    if (resendCountdown > 0 || resending) return;
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg('Mohon isi alamat email terlebih dahulu.');
      return;
    }

    setResending(true);
    handleClearAlerts();
    try {
      const res = await resetPasswordForEmail(targetEmail);
      if (res.success) {
        setResendCount((prev) => prev + 1);
        setResendCountdown(60);
        setSuccessMsg(`Tautan pemulihan baru berhasil dikirim ulang ke ${targetEmail}! Silakan periksa kotak masuk atau spam email Anda.`);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim ulang tautan reset kata sandi.');
    } finally {
      setResending(false);
    }
  };

  // 5. Handle Set New Password Submit (Simpan Kata Sandi Baru setelah klik link email)
  const handleSetNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearAlerts();

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok. Mohon periksa kembali.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Kata sandi berhasil diperbarui! Mengalihkan ke form masuk...');
        setTimeout(() => {
          if (forgotEmail) {
            setLoginEmail(forgotEmail);
          }
          setLoginPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          handleSwitchTab('login');
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Gagal mengubah kata sandi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Resend Confirmation Email
  const handleResendConfirmation = async (targetEmail: string) => {
    if (!targetEmail) {
      setErrorMsg('Mohon masukkan email Anda terlebih dahulu.');
      return;
    }
    setResending(true);
    handleClearAlerts();
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

  // Quick Demo Login
  const handleDemoClick = (role: 'agent' | 'admin') => {
    handleClearAlerts();
    const user = demoLogin(role);
    setSuccessMsg(`Masuk sebagai ${user.fullName} (${user.role === 'admin' ? 'Administrator' : 'Agent Properti'})`);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 400);
  };

  // If already logged in, show account session card
  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#e4edff]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#0051d5]/15 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0051d5] via-[#316bf3] to-[#00b4d8]" />
          
          <div className="relative inline-block mx-auto mb-5">
            <img
              src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=0051d5&color=fff`}
              alt={currentUser.fullName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0051d5]/20 shadow-md mx-auto"
            />
            <span className={`absolute bottom-0 right-0 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full uppercase tracking-wider text-white ${isAdmin ? 'bg-rose-600' : 'bg-emerald-600'} shadow-sm`}>
              {isAdmin ? 'Admin' : 'Agent'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-[#0e1c2f] tracking-tight">
            Sesi Anda Sedang Aktif
          </h2>
          <p className="text-sm font-semibold text-[#0051d5] mt-1">{currentUser.fullName}</p>
          <p className="text-xs text-gray-500">{currentUser.email}</p>

          <div className="mt-6 p-4 rounded-2xl bg-[#eff4ff]/70 border border-[#0051d5]/10 text-left text-xs space-y-2 text-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status Autentikasi:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung (Supabase)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Hak Akses Sistem:</span>
              <span className="font-bold text-[#0e1c2f]">
                {isAdmin ? 'Administrator Portal Penuh' : 'Agent Pemasaran Properti'}
              </span>
            </div>
            {currentUser.phone && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No. Kontak:</span>
                <span className="font-semibold text-gray-800">{currentUser.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => onNavigate('dashboard-user')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-sm shadow-lg shadow-[#0051d5]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Buka Dashboard {isAdmin ? 'Admin' : 'Agent'}</span>
            </button>

            <button
              onClick={() => onNavigate('katalog-properti')}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm border border-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-gray-500">apartment</span>
              <span>Lihat Katalog Properti Batam</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Keluar / Ganti Akun Lain</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[92vh] bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#e4edff] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header Bar / Back to Home */}
      <div className="max-w-6xl w-full mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('beranda')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-[#0051d5] text-xs sm:text-sm font-semibold border border-gray-200/80 shadow-xs backdrop-blur-md transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          <span>Kembali ke Beranda</span>
        </button>

        {/* Supabase status badge */}
        <div className="flex items-center gap-2">
          {isSupabaseActive ? (
            <div 
              onClick={onOpenSupabaseModal}
              title="Supabase Auth Aktif dan Terhubung"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold shadow-2xs cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Supabase Auth Aktif</span>
            </div>
          ) : (
            <div 
              onClick={onOpenSupabaseModal}
              title="Klik untuk konfigurasi Supabase"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Supabase Fallback Lokal</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual-Column Auth Card */}
      <div className="max-w-6xl w-full mx-auto bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,81,213,0.12)] border border-[#eff4ff] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Column: Batam Real Estate Luxury Showcase */}
        <div className="lg:col-span-5 relative bg-[#0b1c30] text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
          {/* Background Image with Deep Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1c30]/90 via-[#002d7a]/85 to-[#0b1c30]/95" />

          {/* Top Brand Info */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img
                src={BRAND_ASSETS.logoUrl}
                alt="Aset Rumah Batam"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
              />
              <div>
                <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                  Aset Rumah Batam
                </h1>
                <p className="text-xs text-blue-200 font-medium">Portal Properti & Legalitas Resmi</p>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Akses Terpadu Agent & Admin
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Kelola Properti Terbaik di Kota Batam
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                Satu platform terpercaya untuk publikasi listing rumah mewah, validasi hak pakai WNA, pengecekan jatuh tempo UWTO BP Batam, dan multi-upload gambar aset.
              </p>
            </div>
          </div>

          {/* Center Features Pillars */}
          <div className="relative z-10 my-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">collections</span>
              </div>
              <div>
                <p className="font-bold text-white">Multi-Upload Foto Portofolio</p>
                <p className="text-[11px] text-blue-200/80">Unggah foto utama & galeri aset properti sekaligus</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <p className="font-bold text-white">Verifikasi & Moderasi Listing</p>
                <p className="text-[11px] text-blue-200/80">Listing agent ditinjau admin sebelum tayang ke publik</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-blue-50 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
              <div>
                <p className="font-bold text-white">Supabase Cloud Security</p>
                <p className="text-[11px] text-blue-200/80">Proteksi kata sandi dengan enkripsi enterprise</p>
              </div>
            </div>
          </div>

          {/* Bottom Accreditation Note */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70">
            <span>© {new Date().getFullYear()} Aset Rumah Batam</span>
            <span className="font-medium text-white">Batam, Kepulauan Riau</span>
          </div>
        </div>

        {/* Right Column: Interactive Auth Form Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Top Navigation Tabs */}
            <div className="flex items-center bg-[#f0f4ff] p-1.5 rounded-2xl border border-[#0051d5]/10 mb-6">
              <button
                type="button"
                onClick={() => handleSwitchTab('login')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white text-[#0051d5] shadow-xs'
                    : 'text-gray-600 hover:text-[#0051d5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Masuk Akun</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('register')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'register'
                    ? 'bg-white text-[#0051d5] shadow-xs'
                    : 'text-gray-600 hover:text-[#0051d5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Daftar Agent</span>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-extrabold ml-1">
                  Agent
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab('forgot')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'forgot' || activeTab === 'reset_password'
                    ? 'bg-white text-[#0051d5] shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {activeTab === 'reset_password' ? 'key' : 'lock_reset'}
                </span>
                <span>{activeTab === 'reset_password' ? 'Sandi Baru' : 'Lupa Sandi'}</span>
              </button>
            </div>

            {/* Notification Alerts */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <span className="material-symbols-outlined text-rose-600 text-[20px] shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex-1">
                  <p className="font-bold">Gagal Diproses</p>
                  <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                  {errorMsg.toLowerCase().includes('sudah terdaftar') && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail(regEmail || loginEmail);
                        handleSwitchTab('login');
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#316bf3] transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Beralih ke Tab Masuk Akun</span>
                    </button>
                  )}
                  {errorMsg.includes('belum dikonfirmasi') && (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={() => handleResendConfirmation(loginEmail || regEmail)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-900 underline hover:no-underline cursor-pointer"
                    >
                      {resending ? 'Mengirim ulang...' : 'Kirim Ulang Email Konfirmasi'}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div className="flex-1">
                  <p className="font-bold">Berhasil</p>
                  <p className="mt-0.5 leading-relaxed">{successMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="text-emerald-500 hover:text-emerald-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TAB 1: MASUK AKUN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="contoh: agent@asetrumahbatam.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#0e1c2f]">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('forgot')}
                      className="text-xs font-semibold text-[#0051d5] hover:underline cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#0051d5] rounded border-gray-300 focus:ring-[#0051d5]"
                    />
                    <span className="text-xs text-gray-600 font-medium">Ingat saya di perangkat ini</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0051d5]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      <span>Masuk ke Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: DAFTAR BARU (KHUSUS AGENT) */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Agent role exclusivity notice */}
                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-900 text-xs flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0">
                    badge
                  </span>
                  <div>
                    <span className="font-bold">Pendaftaran Khusus Agent Properti.</span> Akun Administrator dikelola secara privat oleh sistem ARB.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                    Nama Lengkap & Gelar (Agent)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="contoh: Hendra Wijaya, S.E."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                        phone
                      </span>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812-7000-xxxx"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#0e1c2f]">
                        Alamat Email
                      </label>
                      {emailCheckLoading && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 border border-[#0051d5] border-t-transparent rounded-full animate-spin"></span>
                          Memeriksa...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onBlur={handleRegEmailBlur}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (emailExistsWarning) setEmailExistsWarning(null);
                        }}
                        placeholder="agent@email.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium ${
                          emailExistsWarning
                            ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-rose-900'
                            : 'border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20'
                        }`}
                      />
                    </div>
                    {emailExistsWarning && (
                      <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between gap-2 animate-in fade-in">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[15px] text-rose-600 shrink-0">error</span>
                          {emailExistsWarning}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail(regEmail);
                            handleSwitchTab('login');
                          }}
                          className="shrink-0 text-[#0051d5] hover:text-[#003bb5] font-bold underline cursor-pointer"
                        >
                          Masuk Sekarang →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                        lock
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 karakter"
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showRegPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                      Konfirmasi Sandi
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                        lock_reset
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi sandi"
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-[#0051d5] rounded border-gray-300 focus:ring-[#0051d5]"
                    />
                    <span className="text-[11px] sm:text-xs text-gray-600">
                      Saya bersedia mematuhi kode etik pemasaran properti & ketentuan moderasi listing oleh Administrator ARB.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || Boolean(emailExistsWarning)}
                  className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    emailExistsWarning
                      ? 'bg-gray-400 hover:bg-gray-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-600/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mendaftarkan Akun Agent...</span>
                    </>
                  ) : emailExistsWarning ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>Email Sudah Terdaftar (Beralih ke Masuk)</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>Daftar Sebagai Agent Properti</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: PEMULIHAN SANDI (LUPA SANDI DENGAN RESEND) */}
            {activeTab === 'forgot' && (
              <div className="space-y-4">
                {!forgotSent ? (
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/60 text-blue-900 text-xs sm:text-sm leading-relaxed">
                      <p className="font-bold flex items-center gap-1.5 text-sm text-[#0051d5] mb-1">
                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                        Pemulihan Kata Sandi Akun
                      </p>
                      Masukkan alamat email akun Anda. Supabase Auth akan mengirimkan tautan aman ke kotak masuk email Anda untuk mengatur ulang kata sandi.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0e1c2f] mb-1.5">
                        Alamat Email Terdaftar
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                          mail
                        </span>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="contoh: agent@asetrumahbatam.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Mengirim Tautan...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            <span>Kirim Tautan Reset Sandi</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchTab('login')}
                        className="py-3 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Kartu Sukses Pengiriman & Panel Resend */
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-emerald-900 leading-tight">
                            Tautan Pemulihan Berhasil Dikirim!
                          </h4>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            Periksa kotak masuk utama atau folder spam email Anda
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Tujuan Email:</span>
                          <span className="font-bold text-[#0e1c2f] truncate max-w-[220px]">{forgotEmail}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Frekuensi Kirim:</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Terkirim {resendCount > 1 ? `(${resendCount} kali)` : '1 kali'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] sm:text-xs text-emerald-800 leading-relaxed font-normal">
                        Buka email dari <strong>Supabase / Aset Rumah Batam</strong> lalu klik tautan verifikasi untuk membuat kata sandi baru akun Anda.
                      </p>
                    </div>

                    {/* Resend Box dengan Cooldown Timer */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-700">Belum menerima email pemulihan?</span>
                        {resendCountdown > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] animate-spin">timelapse</span>
                            <span>{resendCountdown}s</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={resending || resendCountdown > 0}
                          onClick={handleResendForgot}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                            resendCountdown > 0 || resending
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#0051d5] hover:bg-[#316bf3] text-white active:scale-95'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${resending ? 'animate-spin' : ''}`}>
                            {resending ? 'progress_activity' : 'forward_to_inbox'}
                          </span>
                          <span>
                            {resending
                              ? 'Mengirim Ulang...'
                              : resendCountdown > 0
                              ? `Kirim Ulang Tautan (${resendCountdown} detik)`
                              : 'Kirim Ulang Tautan Sekarang'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setForgotSent(false);
                            handleClearAlerts();
                          }}
                          className="py-3 px-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Ganti Email</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleSwitchTab('login')}
                        className="text-xs text-gray-600 hover:text-[#0051d5] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                        <span>Sudah ingat kata sandi? Masuk ke Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SETEL KATA SANDI BARU (RESET PASSWORD RECOVERY) */}
            {activeTab === 'reset_password' && (
              <form onSubmit={handleSetNewPasswordSubmit} className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 text-sm text-emerald-800 mb-1">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Setel Kata Sandi Baru
                  </p>
                  Tautan pemulihan Anda valid. Silakan buat kata sandi baru untuk akun Anda (minimal 6 karakter).
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      lock
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru (min 6 karakter)"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      lock_reset
                    </span>
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-[#0051d5] focus:ring-2 focus:ring-[#0051d5]/20 text-xs sm:text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Menyimpan Kata Sandi...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        <span>Simpan Kata Sandi Baru</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchTab('login')}
                    className="py-3 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-Click Demo Accounts */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">bolt</span>
                  Akun Uji Coba 1-Klik:
                </span>
                <span className="text-[11px] text-gray-400">Tanpa registrasi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoClick('agent')}
                  className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-left transition-all cursor-pointer group flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    AG
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-emerald-950 truncate">Agent: Hendra Wijaya</p>
                    <p className="text-[10px] text-emerald-700 truncate">Tambah & kelola listing properti</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoClick('admin')}
                  className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100 border border-rose-200 text-left transition-all cursor-pointer group flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    AD
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-rose-950 truncate">Admin: Utama ARB</p>
                    <p className="text-[10px] text-rose-700 truncate">Moderasi & persetujuan listing</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
              Supabase 256-bit SSL Auth
            </span>
            <button
              onClick={() => onNavigate('panduan-legalitas-uwto')}
              className="text-[#0051d5] hover:underline font-medium"
            >
              Panduan Legalitas UWTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
