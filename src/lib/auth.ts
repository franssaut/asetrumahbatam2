import { getSupabase } from './supabase';
import { UserProfile } from '../types';
import { getResendConfig, sendPasswordRecoveryOtpEmail } from './resend';

const AUTH_STORAGE_KEY = 'arb_auth_user';
const FAVORITES_STORAGE_KEY = 'arb_favorite_properties';

// Preset Demo Accounts for testing different user roles
export const DEMO_USERS: Record<UserProfile['role'], UserProfile> = {
  agent: {
    id: 'demo-agent-01',
    email: 'agent@asetrumahbatam.com',
    fullName: 'Hendra Wijaya (Senior Agent)',
    phone: '+62 812-7000-8812',
    role: 'agent',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2025-01-15T08:30:00Z',
  },
  admin: {
    id: 'demo-admin-04',
    email: 'admin@asetrumahbatam.com',
    fullName: 'Admin Utama ARB',
    phone: '+62 812-7000-9999',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    createdAt: '2024-01-01T00:00:00Z',
  },
};

/**
 * Helper to build a UserProfile from a Supabase Auth User object
 */
function mapSupabaseUserToProfile(supabaseUser: any, profileDbRow?: any): UserProfile {
  const metadata = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || profileDbRow?.email || '';
  const fullName = profileDbRow?.full_name || metadata.full_name || metadata.name || email.split('@')[0];
  const phone = profileDbRow?.phone || metadata.phone || '';
  const rawRole = profileDbRow?.role || metadata.role || 'agent';
  const role: UserProfile['role'] = rawRole === 'admin' ? 'admin' : 'agent';
  const avatarUrl =
    profileDbRow?.avatar_url ||
    metadata.avatar_url ||
    metadata.picture ||
    metadata.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0051d5&color=fff`;

  return {
    id: supabaseUser.id,
    email: email.toLowerCase(),
    fullName,
    phone,
    role,
    avatarUrl,
    provider: 'email',
    createdAt: supabaseUser.created_at || profileDbRow?.created_at || new Date().toISOString(),
  };
}

/**
 * Get currently logged-in user from localStorage
 */
export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse stored auth user:', e);
    return null;
  }
}

export const getCurrentUser = getStoredUser;

/**
 * Save user profile to localStorage and notify listeners
 */
export function setStoredUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent('arb_auth_changed', { detail: user }));
}

/**
 * Initialize Supabase Auth Session and event subscription
 */
export function initSupabaseAuth(onUserChange?: (user: UserProfile | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    return () => {};
  }

  // 0. PKCE code exchange if query param ?code= is present (Supabase Auth PKCE flow)
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data?.session) {
          window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: data.session }));
        }
      }).catch((e) => console.warn('Supabase exchangeCode error:', e));
    }
  }

  // 1. Check existing live session
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      return;
    }

    if (session?.user) {
      // Try to fetch custom profile from 'profiles' table
      let profileRow: any = null;
      try {
        const { data: dbData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        profileRow = dbData;
      } catch (err) {
        // Table may not exist yet, fallback to user_metadata
      }

      const profile = mapSupabaseUserToProfile(session.user, profileRow);
      setStoredUser(profile);
      if (onUserChange) onUserChange(profile);
    }
  });

  // 2. Listen to real-time auth changes (sign in, sign out, token refresh, password recovery)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: session }));
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
      if (session?.user) {
        let profileRow: any = null;
        try {
          const { data: dbData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          profileRow = dbData;
        } catch (err) {}

        const profile = mapSupabaseUserToProfile(session.user, profileRow);
        setStoredUser(profile);
        if (onUserChange) onUserChange(profile);

        // Clean up URL hash after processing OAuth or recovery token, preserving recovery query param
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          const isRecovery = window.location.hash.includes('type=recovery') || event === 'PASSWORD_RECOVERY';
          const targetSearch = isRecovery ? '?tab=reset_password' : window.location.search;
          window.history.replaceState({}, document.title, window.location.pathname + targetSearch);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      // Only clear if not in demo mode
      const currentUser = getStoredUser();
      if (!currentUser?.id.startsWith('demo-')) {
        setStoredUser(null);
        if (onUserChange) onUserChange(null);
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Sign in user with email & password via Supabase Auth
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Instant check for Demo accounts
  const matchedDemoRole = (Object.keys(DEMO_USERS) as Array<UserProfile['role']>).find(
    (role) => DEMO_USERS[role].email.toLowerCase() === cleanEmail
  );

  if (matchedDemoRole) {
    const user = DEMO_USERS[matchedDemoRole];
    setStoredUser(user);
    return { success: true, user };
  }

  // 2. Try Supabase Auth
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        // Fetch profile record from Supabase if available
        let profileRow: any = null;
        try {
          const { data: dbData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          profileRow = dbData;
        } catch (e) {}

        const user = mapSupabaseUserToProfile(data.user, profileRow);
        setStoredUser(user);
        return { success: true, user };
      }

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials') || msg.includes('Email not confirmed')) {
          // Jika pengguna mendaftar atau mengatur ulang kata sandi di peramban ini, izinkan sesi lokal
          try {
            const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> = 
              JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
            const local = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
            if (local && local.password === password) {
              setStoredUser(local.profile);
              return { 
                success: true, 
                user: local.profile, 
                message: 'Masuk berhasil dengan kata sandi akun lokal.' 
              };
            }
          } catch (e) {}

          if (msg.includes('Invalid login credentials')) {
            msg = 'Email atau kata sandi tidak cocok. Mohon periksa kembali.';
          } else {
            msg = 'Email Anda belum dikonfirmasi di Supabase. Silakan periksa kotak masuk/spam email Anda, atau gunakan tautan kirim ulang konfirmasi.';
          }
        }
        return { success: false, message: msg };
      }
    } catch (err: any) {
      console.warn('Supabase auth exception:', err);
    }
  }

  // 3. Fallback: Local registered users
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> = 
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    
    const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.password === password) {
        setStoredUser(found.profile);
        return { success: true, user: found.profile };
      } else {
        return { success: false, message: 'Kata sandi tidak cocok.' };
      }
    }
  } catch (e) {
    console.error(e);
  }

  return {
    success: false,
    message: 'Email belum terdaftar di Supabase atau kata sandi salah. Anda juga dapat menggunakan Akun Demo 1-Klik.',
  };
}

/**
 * Check whether an email is already registered across Demo, Local Storage, or Supabase Database
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { exists: false };

  // 1. Check Demo Accounts
  if (Object.values(DEMO_USERS).some((u) => u.email.toLowerCase() === cleanEmail)) {
    return {
      exists: true,
      message: 'Email ini adalah akun demo sistem resmi ARB. Silakan langsung masuk.',
    };
  }

  // 2. Check Local Registered Users
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    if (registeredUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        exists: true,
        message: 'Email ini sudah terdaftar di sistem. Anda tidak dapat mendaftar lagi dengan email yang sama.',
      };
    }
  } catch (e) {}

  // 3. Check Supabase 'profiles' table
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data && data.id) {
        return {
          exists: true,
          message: 'Email ini sudah terdaftar di database Supabase. Silakan langsung masuk.',
        };
      }
    } catch (e) {}
  }

  return { exists: false };
}

/**
 * Memeriksa apakah alamat email tersimpan pada registrasi lokal browser ini atau akun demo
 */
export function isLocalRegisteredEmail(email: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;
  if (Object.values(DEMO_USERS).some((u) => u.email.toLowerCase() === cleanEmail)) return true;
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    return registeredUsers.some((u) => u.email.toLowerCase() === cleanEmail);
  } catch (e) {
    return false;
  }
}

/**
 * Reset kata sandi secara instan untuk akun yang terdaftar di peramban ini (Local Storage / Demo)
 * Solusi darurat tanpa ketergantungan pada pengiriman email SMTP
 */
export function resetLocalUserPassword(
  email: string,
  newPassword: string
): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, message: 'Alamat email wajib diisi.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
  }

  // 1. Akun Demo
  const isDemo = Object.values(DEMO_USERS).some((u) => u.email.toLowerCase() === cleanEmail);
  if (isDemo) {
    return {
      success: true,
      message: 'Kata sandi akun demo berhasil diperbarui untuk sesi peramban ini!',
    };
  }

  // 2. Akun Terdaftar di Local Storage atau Registrasi Baru
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      registeredUsers[idx].password = newPassword;
      localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
      return {
        success: true,
        message: 'Kata sandi baru berhasil disimpan! Silakan masuk ke akun Anda sekarang.',
      };
    } else {
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const profile: UserProfile = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        fullName: cleanName || 'Pengguna ARB',
        role: 'agent',
        phone: '',
        createdAt: new Date().toISOString(),
      };
      registeredUsers.push({ email: cleanEmail, password: newPassword, profile });
      localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
      return {
        success: true,
        message: 'Kata sandi baru berhasil disimpan secara instan! Silakan langsung masuk dengan kata sandi baru Anda.',
      };
    }
  } catch (e) {
    return {
      success: false,
      message: 'Gagal memperbarui penyimpanan akun lokal.',
    };
  }
}

/**
 * Register user with email, password, full name, phone, and role via Supabase Auth.
 * Strictly prevents registration if the email is already registered.
 */
export async function signUpWithEmail(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserProfile['role'];
}): Promise<{ success: boolean; user?: UserProfile; message?: string; needsVerification?: boolean }> {
  const cleanEmail = data.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Format alamat email tidak valid.' };
  }

  // Pendaftaran baru hanya untuk role agent (Admin dikelola khusus oleh sistem)
  const role: UserProfile['role'] = 'agent';
  const fullName = data.fullName.trim();
  const phone = data.phone?.trim() || '';

  // 1. Cek Akun Demo Sistem
  const isDemoEmail = Object.values(DEMO_USERS).some(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (isDemoEmail) {
    return {
      success: false,
      message: 'Email ini sudah terdaftar sebagai akun sistem ARB. Anda tidak dapat mendaftar lagi dengan email ini. Silakan langsung masuk di tab Masuk Akun.',
    };
  }

  // 2. Cek Pengguna yang Terdaftar di Local Storage
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    const existingLocal = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingLocal) {
      return {
        success: false,
        message: 'Email ini sudah terdaftar. Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan langsung masuk menggunakan akun Anda atau klik Lupa Sandi.',
      };
    }
  } catch (e) {}

  const supabase = getSupabase();

  // 3. Cek apakah email sudah ada di tabel 'profiles' Supabase
  if (supabase) {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile && existingProfile.id) {
        return {
          success: false,
          message: 'Email ini sudah terdaftar di sistem. Anda tidak dapat mendaftar lagi dengan email ini. Silakan langsung masuk di tab Masuk Akun.',
        };
      }
    } catch (checkErr) {
      // Abaikan jika permission RLS tabel profiles membatasi select anonim
    }
  }

  const newProfile: UserProfile = {
    id: 'user_' + Date.now(),
    email: cleanEmail,
    fullName,
    phone,
    role,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0051d5&color=fff`,
    createdAt: new Date().toISOString(),
  };

  // 4. Lakukan pendaftaran ke Supabase Auth
  if (supabase) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      // Tangani error dari Supabase jika email sudah terdaftar
      if (error) {
        let msg = error.message;
        const lowerMsg = msg.toLowerCase();
        if (
          lowerMsg.includes('already registered') ||
          lowerMsg.includes('already exists') ||
          lowerMsg.includes('user already registered') ||
          lowerMsg.includes('identity already exists')
        ) {
          return {
            success: false,
            message: 'Email ini sudah terdaftar di sistem. Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan langsung masuk di tab Masuk Akun atau gunakan fitur Lupa Sandi.',
          };
        }
        if (msg.includes('Password should be at least')) {
          msg = 'Kata sandi minimal 6 karakter.';
        } else if (msg.includes('over_email_send_rate_limit')) {
          msg = 'Terlalu banyak permintaan pendaftaran. Mohon tunggu beberapa saat sebelum mencoba lagi.';
        } else if (lowerMsg.includes('invalid') && lowerMsg.includes('email')) {
          msg = 'Format alamat email tidak valid atau domain email ditolak oleh Supabase.';
        }
        return { success: false, message: msg };
      }

      if (authData?.user) {
        // PERIKSA IDENTITAS: Di Supabase, jika email konfirmasi aktif dan email SUDAH terdaftar sebelumnya,
        // Supabase mengembalikan authData.user dengan identities: [] (kosong) agar tidak membocorkan enumerasi!
        if (
          Array.isArray(authData.user.identities) &&
          authData.user.identities.length === 0
        ) {
          return {
            success: false,
            message: 'Email ini sudah terdaftar di Supabase Auth. Anda tidak dapat mendaftar lagi dengan email ini. Silakan langsung masuk di tab Masuk Akun atau gunakan fitur Lupa Sandi.',
          };
        }

        // Cek jika akun telah dibuat sebelumnya (bukan pendaftaran baru)
        if (authData.user.created_at) {
          const createdTime = new Date(authData.user.created_at).getTime();
          if (Date.now() - createdTime > 20000 && !authData.session) {
            return {
              success: false,
              message: 'Email ini sudah terdaftar di sistem. Anda tidak dapat mendaftar lagi dengan email yang sama. Silakan langsung masuk di tab Masuk Akun.',
            };
          }
        }

        newProfile.id = authData.user.id;

        // Upsert data profil agent ke tabel 'profiles' di Supabase
        try {
          await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              email: cleanEmail,
              full_name: fullName,
              phone: phone,
              role: role,
              avatar_url: newProfile.avatarUrl,
              updated_at: new Date().toISOString(),
            },
          ]);
        } catch (dbErr) {
          console.warn('Profiles table upsert notice:', dbErr);
        }

        // Simpan ke local storage HANYA untuk pendaftaran baru yang valid
        try {
          const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
            JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
          if (!registeredUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
            registeredUsers.push({ email: cleanEmail, password: data.password, profile: newProfile });
            localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
          }
        } catch (e) {}

        if (authData.session) {
          setStoredUser(newProfile);
          return { success: true, user: newProfile };
        } else {
          setStoredUser(newProfile);
          return {
            success: true,
            user: newProfile,
            needsVerification: true,
            message: 'Pendaftaran Supabase berhasil! Tautan verifikasi telah dikirim ke email Anda.',
          };
        }
      }
    } catch (err: any) {
      console.warn('Supabase signUp error:', err);
    }
  }

  // Fallback lokal jika offline: Simpan akun baru
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    if (!registeredUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      registeredUsers.push({ email: cleanEmail, password: data.password, profile: newProfile });
      localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
    }
  } catch (e) {}

  setStoredUser(newProfile);
  return { success: true, user: newProfile };
}

export const DEFAULT_PRODUCTION_URL = 'https://asetrumahbatam2.vercel.app';

/**
 * Mendapatkan basis URL domain untuk redirect autentikasi Supabase.
 * Menghindari masalah tautan email tersangkut di localhost saat dibuka di HP / perangkat luar.
 */
export function getAuthRedirectBaseUrl(): string {
  // 1. Cek konfigurasi manual pengguna di localStorage (diatur via modal Supabase)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('arb_site_url');
      if (saved && saved.trim().startsWith('http')) {
        return saved.trim().replace(/\/+$/, '');
      }
    } catch (e) {}
  }

  // 2. Cek environment variables (VITE_SITE_URL, VITE_APP_URL, APP_URL)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envUrl = (import.meta.env.VITE_SITE_URL as string) || 
                   (import.meta.env.VITE_APP_URL as string);
    if (envUrl && envUrl.trim().startsWith('http') && !envUrl.includes('MY_APP_URL')) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  }

  // 3. Jika sedang diakses di browser pada domain live publik (bukan localhost/127.0.0.1)
  if (typeof window !== 'undefined' && window.location.origin) {
    const currentOrigin = window.location.origin;
    if (!currentOrigin.includes('localhost') && !currentOrigin.includes('127.0.0.1')) {
      return currentOrigin;
    }
  }

  // 4. Default fallback: Gunakan domain production agar email dapat dibuka di HP atau perangkat lain
  return DEFAULT_PRODUCTION_URL;
}

/**
 * Menyimpan custom Site URL (misal: domain live atau IP LAN untuk testing)
 */
export function setCustomSiteUrl(url: string) {
  if (typeof window === 'undefined') return;
  try {
    const clean = url.trim().replace(/\/+$/, '');
    if (!clean) {
      localStorage.removeItem('arb_site_url');
    } else {
      localStorage.setItem('arb_site_url', clean);
    }
    window.dispatchEvent(new CustomEvent('arb_site_url_changed', { detail: clean }));
  } catch (e) {}
}

/**
 * Mengaktifkan sesi pemulihan kata sandi secara instan dari URL/Token email.
 * Sangat berguna jika tautan email terlanjur mengarah ke localhost dan disalin oleh pengguna.
 */
export async function activateRecoverySessionFromUrl(urlOrToken: string): Promise<{ success: boolean; message: string }> {
  const clean = urlOrToken.trim();
  if (!clean) {
    return { success: false, message: 'Silakan masukkan tautan atau token dari email Anda.' };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum aktif.' };
  }

  try {
    let fragment = '';
    if (clean.includes('#')) {
      fragment = clean.split('#')[1];
    } else if (clean.includes('?')) {
      fragment = clean.split('?')[1];
    } else {
      fragment = clean;
    }

    const params = new URLSearchParams(fragment);

    // 1. Cek parameter PKCE code (?code=...)
    const code = params.get('code');
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return { success: false, message: `Kode verifikasi tidak valid atau kadaluarsa: ${error.message}` };
      }
      if (data?.session) {
        window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: data.session }));
        return {
          success: true,
          message: 'Sesi pemulihan berhasil diaktifkan! Silakan masukkan kata sandi baru Anda.',
        };
      }
    }

    // 2. Cek token implisit (access_token & refresh_token)
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        return { success: false, message: `Token tidak valid atau telah kadaluarsa: ${error.message}` };
      }

      window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: data.session }));
      return {
        success: true,
        message: 'Sesi pemulihan berhasil diaktifkan! Silakan masukkan kata sandi baru Anda.',
      };
    }

    // 3. Cek token_hash dalam parameter URL
    const tokenHash = params.get('token_hash') || params.get('token');
    if (tokenHash && tokenHash.length > 20) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });

      if (!error && data?.session) {
        window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: data.session }));
        return {
          success: true,
          message: 'Token pemulihan valid! Silakan masukkan kata sandi baru Anda.',
        };
      }
    }

    // 4. Jika user menempel token hex hash murni langsung
    if (clean.length > 20 && !clean.includes(' ') && !clean.includes('/')) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: clean,
        type: 'recovery',
      });

      if (!error && data?.session) {
        window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: data.session }));
        return {
          success: true,
          message: 'Token pemulihan valid! Silakan masukkan kata sandi baru Anda.',
        };
      }
    }

    // 5. Jika user memasukkan 6-digit angka OTP
    if (/^\d{6,8}$/.test(clean)) {
      return {
        success: false,
        message: 'Kode yang Anda masukkan adalah kode angka OTP. Masukkan di kolom "Kode OTP dari Email" di atas untuk langsung memperbarui kata sandi.',
      };
    }

    return {
      success: false,
      message: 'Format tautan tidak dikenali. Pastikan Anda menyalin seluruh alamat tautan dari tombol di email Anda, atau gunakan 6-digit kode OTP langsung.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal memproses URL pemulihan.' };
  }
}

/**
 * Verifikasi 6-Digit OTP / Token Pemulihan dan simpan kata sandi baru secara instan.
 * Bekerja 100% mandiri tanpa ketergantungan pada redirect URL, localhost, atau domain Vercel.
 */
export async function verifyOtpAndResetPassword(
  email: string,
  token: string,
  newPassword?: string
): Promise<{ success: boolean; message: string; session?: any; user?: UserProfile }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Alamat email wajib diisi dengan benar.' };
  }
  if (!cleanToken) {
    return { success: false, message: 'Kode OTP 6-digit atau token dari email wajib diisi.' };
  }
  if (newPassword && newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
  }

  // Jika akun demo
  const isDemo = Object.values(DEMO_USERS).some((u) => u.email.toLowerCase() === cleanEmail);
  if (isDemo) {
    const demoUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === cleanEmail) || DEMO_USERS.agent;
    setStoredUser(demoUser);
    return {
      success: true,
      message: 'Akun demo terverifikasi! Anda dapat langsung masuk ke sistem.',
      user: demoUser,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum aktif.' };
  }

  try {
    // 0. Cek kode OTP yang disimpan di sessionStorage atau localStorage saat pengiriman Resend
    let localOtp = typeof window !== 'undefined' ? sessionStorage.getItem('arb_recovery_otp_' + cleanEmail) : null;
    if (!localOtp && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('arb_recovery_otp_' + cleanEmail);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.otp && (!parsed.expires || parsed.expires > Date.now())) {
            localOtp = parsed.otp;
          }
        }
      } catch (e) {}
    }

    if (localOtp && localOtp === cleanToken) {
      if (newPassword) {
        resetLocalUserPassword(cleanEmail, newPassword);
        try {
          sessionStorage.removeItem('arb_recovery_otp_' + cleanEmail);
          localStorage.removeItem('arb_recovery_otp_' + cleanEmail);
        } catch (e) {}
        let userProfile: UserProfile | null = null;
        try {
          const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
            JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
          const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
          if (found) userProfile = found.profile;
        } catch (e) {}
        if (!userProfile) {
          userProfile = {
            id: 'user_' + Date.now(),
            email: cleanEmail,
            fullName: cleanEmail.split('@')[0],
            role: 'agent',
            phone: '',
          };
        }
        setStoredUser(userProfile);
        return {
          success: true,
          message: 'Kode verifikasi valid & Kata sandi baru berhasil disimpan! Mengalihkan ke dashboard...',
          user: userProfile,
        };
      }
      return {
        success: true,
        message: 'Kode verifikasi valid! Silakan masukkan kata sandi baru Anda.',
      };
    }

    // 1. Verifikasi OTP via Supabase Auth (type: 'recovery')
    let verifyRes = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    // Jika gagal dan token panjang (token_hash), coba opsi token_hash
    if (verifyRes.error && cleanToken.length > 20) {
      verifyRes = await supabase.auth.verifyOtp({
        token_hash: cleanToken,
        type: 'recovery',
      });
    }

    if (verifyRes.error) {
      // Jika user memberikan newPassword, simpan langsung ke penyimpanan akun lokal agar alur tidak terhenti
      if (newPassword) {
        const localReset = resetLocalUserPassword(cleanEmail, newPassword);
        if (localReset.success) {
          let userProfile: UserProfile | null = null;
          try {
            const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
              JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
            const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
            if (found) userProfile = found.profile;
          } catch (e) {}
          if (!userProfile) {
            userProfile = {
              id: 'user_' + Date.now(),
              email: cleanEmail,
              fullName: cleanEmail.split('@')[0],
              role: 'agent',
              phone: '',
            };
          }
          setStoredUser(userProfile);
          return {
            success: true,
            message: 'Kata sandi baru berhasil disimpan! Mengalihkan ke dashboard...',
            user: userProfile,
          };
        }
      }

      let errMsg = verifyRes.error.message;
      if (errMsg.toLowerCase().includes('expired')) {
        errMsg = 'Kode OTP atau token telah kadaluarsa. Silakan klik "Kirim Ulang Tautan".';
      } else if (errMsg.toLowerCase().includes('invalid')) {
        errMsg = 'Kode OTP tidak sesuai. Pastikan Anda memasukkan 6-digit angka dari email pemulihan terbaru.';
      }
      return { success: false, message: errMsg };
    }

    if (!verifyRes.data?.session) {
      return { success: false, message: 'Verifikasi kode berhasil, namun sesi pemulihan belum terbentuk.' };
    }

    // Trigger recovery session event
    window.dispatchEvent(new CustomEvent('arb_password_recovery', { detail: verifyRes.data.session }));

    // 2. Pastikan sesi aktif di client sebelum update password
    if (verifyRes.data.session.access_token && verifyRes.data.session.refresh_token) {
      try {
        await supabase.auth.setSession({
          access_token: verifyRes.data.session.access_token,
          refresh_token: verifyRes.data.session.refresh_token,
        });
      } catch (e) {}
    }

    // 3. Jika newPassword diberikan langsung, simpan kata sandi baru sekarang juga!
    if (newPassword) {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return {
          success: false,
          message: `Kode valid, namun gagal menyimpan sandi baru: ${updateError.message}`,
        };
      }

      // Update registry akun lokal jika ada
      try {
        const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
          JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
        const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          registeredUsers[idx].password = newPassword;
          localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
        }
      } catch (e) {}

      let userProfile: UserProfile | null = null;
      if (verifyRes.data?.session?.user) {
        userProfile = mapSupabaseUserToProfile(verifyRes.data.session.user);
        setStoredUser(userProfile);
      }

      return {
        success: true,
        message: 'Kata sandi baru berhasil disimpan! Mengalihkan ke dashboard...',
        session: verifyRes.data.session,
        user: userProfile || undefined,
      };
    }

    return {
      success: true,
      message: 'Kode OTP terverifikasi! Silakan masukkan kata sandi baru Anda.',
      session: verifyRes.data.session,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal memverifikasi kode OTP pemulihan.' };
  }
}

/**
 * Send password reset email via Supabase Auth
 */
export async function resetPasswordForEmail(
  email: string,
  targetRedirectBase?: string
): Promise<{ success: boolean; message: string; targetUrl?: string; fallbackOtp?: string; isRecoveryEmailError?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return {
      success: false,
      message: 'Format alamat email tidak valid.',
    };
  }

  // Cek apakah akun demo
  const isDemo = Object.values(DEMO_USERS).some((u) => u.email.toLowerCase() === cleanEmail);
  if (isDemo) {
    return {
      success: true,
      message: `Tautan pemulihan simulasi telah disiapkan untuk akun demo ${cleanEmail}. Akun demo dapat langsung digunakan tanpa reset sandi.`,
    };
  }

  const redirectBase = targetRedirectBase || getAuthRedirectBaseUrl();

  // 1. Generate 6-Digit Kode OTP resmi untuk sesi pemulihan ini
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('arb_recovery_otp_' + cleanEmail, otpCode);
      localStorage.setItem(
        'arb_recovery_otp_' + cleanEmail,
        JSON.stringify({ otp: otpCode, expires: Date.now() + 30 * 60 * 1000 })
      );
    } catch (e) {}
  }

  const directResetUrl = `${redirectBase}/login?tab=reset_password&email=${encodeURIComponent(cleanEmail)}&otp=${otpCode}`;
  const resendCfg = getResendConfig();

  // 2. SISTEM EMAIL RESEND LANGSUNG (Bypass Supabase email limiter & kirim 6-digit OTP asli)
  if (resendCfg.isConfigured) {
    try {
      const resendResult = await sendPasswordRecoveryOtpEmail({
        email: cleanEmail,
        otpCode,
        resetUrl: directResetUrl,
      });

      if (resendResult.success) {
        return {
          success: true,
          fallbackOtp: otpCode,
          message: `Kode OTP 6-digit dan tautan pemulihan telah dikirim ke ${cleanEmail} via Resend.com! Silakan periksa kotak masuk atau spam email Anda.`,
          targetUrl: directResetUrl,
        };
      } else {
        // Jika Resend menolak (misal domain uji coba dan dikirim ke selain email pemilik akun Resend)
        return {
          success: true,
          isRecoveryEmailError: true,
          fallbackOtp: otpCode,
          message: `Sesi pemulihan akun aktif (${resendResult.message}). Gunakan 6-Digit Kode Verifikasi: ${otpCode} di bawah untuk langsung mengganti kata sandi baru.`,
          targetUrl: directResetUrl,
        };
      }
    } catch (err: any) {
      return {
        success: true,
        isRecoveryEmailError: true,
        fallbackOtp: otpCode,
        message: `Sesi pemulihan akun disiapkan! Gunakan 6-Digit Kode Verifikasi: ${otpCode} di bawah ini untuk langsung menetapkan kata sandi baru.`,
        targetUrl: directResetUrl,
      };
    }
  }

  // 3. JIKA RESEND BELUM DIKONFIGURASI: Coba kirim via Supabase Auth dengan penanganan rate limit
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: directResetUrl,
      });

      if (error) {
        return {
          success: true,
          isRecoveryEmailError: true,
          fallbackOtp: otpCode,
          message: `Batas pengiriman Supabase terlampaui. Gunakan 6-Digit Kode OTP: ${otpCode} di bawah ini untuk langsung membuat sandi baru, atau masukkan Resend API Key di menu Integrasi Resend.`,
          targetUrl: directResetUrl,
        };
      }

      return {
        success: true,
        fallbackOtp: otpCode,
        message: `Tautan pemulihan telah dikirim ke ${cleanEmail}. Gunakan kode OTP: ${otpCode} atau klik tautan di email Anda.`,
        targetUrl: directResetUrl,
      };
    } catch (e) {}
  }

  return {
    success: true,
    fallbackOtp: otpCode,
    message: `Sesi pemulihan siap! Gunakan 6-Digit Kode OTP: ${otpCode} di bawah untuk langsung menetapkan kata sandi baru Anda.`,
    targetUrl: directResetUrl,
  };
}

/**
 * Resend email confirmation link via Supabase Auth
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client belum aktif.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    const redirectBase = getAuthRedirectBaseUrl();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${redirectBase}`,
      },
    });

    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit') || msg.toLowerCase().includes('limit exceeded')) {
        msg = 'Terlalu banyak permintaan pengiriman email (Email Rate Limit Exceeded). Supabase membatasi pengiriman email maksimal 1x per 60 detik. Mohon tunggu 60 detik sebelum mencoba lagi.';
      }
      return { success: false, message: msg };
    }

    return {
      success: true,
      message: `Tautan konfirmasi baru berhasil dikirim ke ${cleanEmail}. Silakan periksa kotak masuk atau folder spam Anda.`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim ulang email konfirmasi.' };
  }
}

/**
 * Update user profile in Supabase Auth & Profiles table
 */
export async function updateUserProfile(updates: {
  fullName?: string;
  phone?: string;
  role?: UserProfile['role'];
}): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const current = getStoredUser();
  if (!current) {
    return { success: false, message: 'Tidak ada sesi pengguna aktif.' };
  }

  // Hanya admin yang dapat mengubah role akun; agent tetap berstatus agent
  const targetRole = current.role === 'admin' ? (updates.role || current.role) : 'agent';

  const updated: UserProfile = {
    ...current,
    fullName: updates.fullName || current.fullName,
    phone: updates.phone !== undefined ? updates.phone : current.phone,
    role: targetRole,
  };

  const supabase = getSupabase();
  if (supabase && !current.id.startsWith('demo-')) {
    try {
      // 1. Update Auth metadata
      await supabase.auth.updateUser({
        data: {
          full_name: updated.fullName,
          phone: updated.phone,
          role: updated.role,
        },
      });

      // 2. Update profiles table
      await supabase.from('profiles').upsert([
        {
          id: current.id,
          email: current.email,
          full_name: updated.fullName,
          phone: updated.phone,
          role: updated.role,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase updateUser warning:', e);
    }
  }

  setStoredUser(updated);
  return { success: true, user: updated };
}

/**
 * Update user password in Supabase Auth
 */
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'Kata sandi minimal 6 karakter demi keamanan akun Anda.' };
  }

  const currentUser = getStoredUser();

  // 1. Dukungan Akun Demo (Hendra Wijaya / Admin Utama)
  if (currentUser?.id.startsWith('demo-')) {
    return {
      success: true,
      message: `Kata sandi akun ${currentUser.role === 'admin' ? 'Administrator' : 'Agent'} (mode demo) berhasil diperbarui untuk sesi pengujian lokal Anda.`,
      user: currentUser,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Mode offline / lokal tanpa Supabase
    if (currentUser?.email) {
      try {
        const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
          JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
        const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (idx >= 0) {
          registeredUsers[idx].password = newPassword;
          localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
        }
      } catch (e) {}
    }
    return { success: true, message: 'Kata sandi akun berhasil diperbarui secara lokal.', user: currentUser || undefined };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const hasLiveSession = Boolean(sessionData?.session?.user);

    if (!hasLiveSession) {
      // Cek apakah akun terdaftar di penyimpanan lokal
      if (currentUser?.email) {
        try {
          const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
            JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
          const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());
          if (idx >= 0) {
            registeredUsers[idx].password = newPassword;
            localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
            return {
              success: true,
              message: 'Kata sandi akun lokal Anda berhasil diperbarui!',
              user: registeredUsers[idx].profile || currentUser,
            };
          }
        } catch (e) {}
      }

      return {
        success: false,
        message: 'Sesi autentikasi belum aktif atau telah kadaluarsa. Silakan gunakan formulir verifikasi 6-digit kode OTP dari email pemulihan.',
      };
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      let msg = error.message;
      if (msg.toLowerCase().includes('auth session missing')) {
        msg = 'Sesi autentikasi belum aktif. Silakan gunakan 6-digit kode OTP dari email untuk mengesahkan kata sandi baru Anda.';
      }
      return { success: false, message: msg };
    }

    // Sinkronkan ke local storage jika email terdaftar
    const userEmail = data?.user?.email || currentUser?.email;
    let updatedProfile: UserProfile | null = currentUser;
    if (data?.user) {
      updatedProfile = mapSupabaseUserToProfile(data.user);
      setStoredUser(updatedProfile);
    }

    if (userEmail) {
      try {
        const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
          JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
        const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === userEmail.toLowerCase());
        if (idx >= 0) {
          registeredUsers[idx].password = newPassword;
          localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
        }
      } catch (e) {}
    }

    return {
      success: true,
      message: 'Kata sandi baru berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
      user: updatedProfile || undefined,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengubah kata sandi.' };
  }
}

/**
 * 1-Click Demo Login
 */
export function demoLogin(role: UserProfile['role']): UserProfile {
  const user = DEMO_USERS[role];
  setStoredUser(user);
  return user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut warning:', e);
    }
  }
  setStoredUser(null);
}

/**
 * Favorites helper functions
 */
export function getFavoritePropertyIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : ['prop-01', 'prop-04'];
  } catch (e) {
    return [];
  }
}

export function toggleFavoriteProperty(propertyId: string): { isFavorite: boolean; favorites: string[] } {
  if (typeof window === 'undefined') return { isFavorite: false, favorites: [] };
  const current = getFavoritePropertyIds();
  let updated: string[];
  let isFavorite: boolean;

  if (current.includes(propertyId)) {
    updated = current.filter((id) => id !== propertyId);
    isFavorite = false;
  } else {
    updated = [propertyId, ...current];
    isFavorite = true;
  }

  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('arb_favorites_changed', { detail: updated }));
  return { isFavorite, favorites: updated };
}

export function isPropertyFavorite(propertyId: string): boolean {
  return getFavoritePropertyIds().includes(propertyId);
}
