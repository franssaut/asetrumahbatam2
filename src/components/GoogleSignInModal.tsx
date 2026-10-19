import React, { useState } from 'react';
import { UserProfile } from '../types';
import { loginWithGoogleAccount, signInWithOAuth } from '../lib/auth';
import { getSupabaseConfig } from '../lib/supabase';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'picker' | 'custom' | 'cloud'>('picker');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserProfile['role']>('agent');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  const supabaseConfig = getSupabaseConfig();
  const supabaseCallbackUrl = supabaseConfig.url 
    ? `${supabaseConfig.url}/auth/v1/callback`
    : 'https://ngdhaamejiuoqpppkfkq.supabase.co/auth/v1/callback';

  if (!isOpen) return null;

  const PRESET_GOOGLE_ACCOUNTS = [
    {
      name: 'Hendra Wijaya',
      email: 'hendra.wijaya.arb@gmail.com',
      role: 'agent' as const,
      roleBadge: '👔 Agent Konsultan',
      roleColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAgPgQwXBHXuq5dU8GEVwkKtPAp2kRxnHFlw-RBitntA60HzT-7of9DwJ6tx1T8frCYk7z5v4qVhzAzo9C0uSgi-baRpHDFMaz9inOoOt1CL8KNeBc4J0ZxA09_oYrAvHjOnZolIirXE6bXz0xxoMCjKTCLFPi6wuIRw_pEejZUR-n5-ufUa7ILKgkb0fQh0BkyBEIQrDV0FjEYnl2yM-vNGi2p6jY-Nf89VvAoDz_5l7Dm64LdjWth',
    },
    {
      name: 'Dewi Lestari',
      email: 'dewi.lestari.arb@gmail.com',
      role: 'agent' as const,
      roleBadge: '👔 Agent Residential',
      roleColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA3n7-NkR78D2ijNWS_RrzTY93mUtJMMHLdO5A2deV1TwoljJlHSPScPY5SqPLAFJT9HcK6CPFaXemEtlJISI4v1MKxKyWXso-kg7lwv9-1vUcxR9ujqbRLEPFV3jjwdJeDMlnjMjZ3cxdEtEEnjgZ11B4UjsfTorfAGzSo4MiHv2xwP4rmUC3u6UgnwupU7YTRPc6gULSbYE8Nn6gYMNWf0G6ndRKb4FAuMvtLlYe01Obo0LLW1ZiR',
    },
    {
      name: 'Admin Utama ARB',
      email: 'admin.asetrumahbatam@gmail.com',
      role: 'admin' as const,
      roleBadge: '🛡️ Administrator Utama',
      roleColor: 'bg-rose-100 text-rose-800 border-rose-300',
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFPHcnFrhmP0BYA3ykvb948oKWZ_YYC5ZMxhDb6oo3bets5cySpVgqs4xwGK7nX013jX68JKEPp_U_HstRwTm34VzgjQcrgiIDUu9pfUQsjvIkdMSYUVKVIATD3ta66rJKb4KUdfIF286UABXsHrP5Sw2_k2HLq9DMQ_Kr0wlaPd_9UMXAybL7BLyA8zpsYronlUEOWWSSCDnHIhZp_d8ZtWAk_iiaQvaMJZyz0IYvvnUKCbc5eJv',
    },
  ];

  const handlePickAccount = async (account: typeof PRESET_GOOGLE_ACCOUNTS[0]) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogleAccount({
        email: account.email,
        fullName: account.name,
        role: account.role,
        avatarUrl: account.avatarUrl,
      });

      if (res.success) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setErrorMsg('Mohon masukkan alamat email Google Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogleAccount({
        email: customEmail.trim(),
        fullName: customName.trim() || customEmail.split('@')[0],
        role: customRole,
      });

      if (res.success) {
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseCloudOAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithOAuth('google');
      if (!res.success) {
        if (res.message?.includes('provider is not enabled') || res.message?.includes('validation_failed')) {
          setErrorMsg(
            'Google OAuth belum diaktifkan di Dashboard Supabase. Anda dapat mengikuti petunjuk aktivasi di bawah atau gunakan Akun Google Instan (1-Klik).'
          );
        } else {
          setErrorMsg(res.message || 'Gagal menghubungkan Google Cloud OAuth.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem OAuth.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(supabaseCallbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-gray-100 text-center relative bg-gradient-to-b from-gray-50/80 to-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* Official Google Logo */}
          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 p-2.5">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-[#0e1c2f]">
            Masuk dengan Google
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pilih akun Google Anda untuk melanjutkan ke <strong className="text-[#0e1c2f]">Aset Rumah Batam</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">error</span>
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          {/* MODE 1: Google Account Chooser List */}
          {activeMode === 'picker' && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Pilih Akun Google:
              </p>

              <div className="space-y-2">
                {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePickAccount(acc)}
                    className="w-full p-3 rounded-2xl border border-gray-200 hover:border-[#0051d5] hover:bg-blue-50/40 transition-all text-left flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-[#0051d5]/30 transition-all"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#0e1c2f] group-hover:text-[#0051d5] transition-colors">
                            {acc.name}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${acc.roleColor}`}>
                            {acc.roleBadge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {acc.email}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-[#0051d5] group-hover:translate-x-0.5 transition-all text-[18px]">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>

              {/* Action: Use Another Google Account */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('custom')}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-gray-300 hover:border-[#0051d5] text-gray-700 hover:text-[#0051d5] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer bg-gray-50/50 hover:bg-white"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Gunakan Alamat Email Google Lain (@gmail.com)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('cloud')}
                  className="w-full py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
                  <span>Opsi Google Cloud OAuth & Panduan Supabase</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: Custom Google Email Input */}
          {activeMode === 'custom' && (
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveMode('picker')}
                  className="text-xs text-[#0051d5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Kembali ke Pilihan Akun</span>
                </button>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Akun Google Baru</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                  Alamat Email Google *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="contoh: nama.anda@gmail.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                  Nama Tampilan di Google
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contoh: Budi Pratama"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0e1c2f] mb-1">
                  Peran Akun Google Baru
                </label>
                <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/80 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-950">👔 Agent Properti</span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Resmi</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-tight mt-0.5">
                      Pendaftaran akun baru Google otomatis terdaftar sebagai Agent Properti untuk mengunggah dan mengelola listing properti.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Menghubungkan Akun Google...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">login</span>
                    <span>Daftar / Masuk sebagai Agent dengan Google</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: Supabase Cloud OAuth Redirect & Setup Instructions */}
          {activeMode === 'cloud' && (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveMode('picker')}
                  className="text-xs text-[#0051d5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Kembali ke Pilihan Akun</span>
                </button>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">Google Cloud OAuth</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-start gap-2 text-blue-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">cloud</span>
                  <span>Redirect Otomatis Google Cloud via Supabase</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Fitur ini akan mengarahkan browser Anda langsung ke halaman login <strong>accounts.google.com</strong> resmi melalui Supabase Auth.
                </p>
                <button
                  type="button"
                  onClick={handleSupabaseCloudOAuth}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Buka Google Cloud OAuth Sekarang</span>
                </button>
              </div>

              {/* Step by step configuration guide for Supabase */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-gray-700">
                <p className="font-bold text-xs text-[#0e1c2f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">settings</span>
                  <span>Panduan Setup Google Provider di Supabase:</span>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-600">
                  <li>Buka <strong>Supabase Dashboard</strong> &gt; Project Anda &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Google</strong>.</li>
                  <li>Aktifkan sakelar <strong>Enable Google provider</strong>.</li>
                  <li>Buat OAuth Client ID di <strong>Google Cloud Console (Credentials)</strong>.</li>
                  <li>Masukkan <strong>Authorized redirect URIs</strong> berikut di Google Cloud Console:</li>
                </ol>

                <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-200">
                  <input
                    type="text"
                    readOnly
                    value={supabaseCallbackUrl}
                    className="w-full text-[10px] font-mono text-gray-600 bg-transparent outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold text-gray-700 shrink-0 cursor-pointer"
                  >
                    {copiedCallback ? 'Tersalin!' : 'Salin URI'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[10px] text-gray-400">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">lock</span>
            <span>Aman & terenkripsi melalui standar protokol OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
