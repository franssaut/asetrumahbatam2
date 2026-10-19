import { getSupabase } from './supabase';
import { UserProfile } from '../types';

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

  // 2. Listen to real-time auth changes (sign in, sign out, token refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
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

        // Clean up URL hash after processing OAuth or email confirmation token
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
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
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email atau kata sandi tidak cocok. Mohon periksa kembali.';
        } else if (msg.includes('Email not confirmed')) {
          // Jika pengguna mendaftar di peramban ini, izinkan sesi lokal agar alur pengujian tidak terhambat
          try {
            const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> = 
              JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
            const local = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
            if (local && local.password === password) {
              setStoredUser(local.profile);
              return { 
                success: true, 
                user: local.profile, 
                message: 'Masuk berhasil dengan akun terdaftar.' 
              };
            }
          } catch (e) {}
          msg = 'Email Anda belum dikonfirmasi di Supabase. Silakan periksa kotak masuk/spam email Anda, atau gunakan tautan kirim ulang konfirmasi.';
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

/**
 * Send password reset email via Supabase Auth
 */
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabase();

  if (!supabase) {
    return {
      success: false,
      message: 'Supabase belum terhubung. Konfigurasikan URL dan Anon Key di menu Supabase.',
    };
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://asetrumahbatam2.vercel.app';
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${origin}/dashboard`,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Tautan pemulihan kata sandi telah dikirim ke ${cleanEmail}. Silakan periksa kotak masuk atau spam email Anda.`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengirim email reset kata sandi.' };
  }
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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://asetrumahbatam2.vercel.app';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${origin}`,
      },
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('rate limit')) {
        msg = 'Terlalu banyak permintaan pengiriman email konfirmasi. Mohon tunggu beberapa saat.';
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
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase belum terhubung.' };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Kata sandi berhasil diperbarui di Supabase Auth!' };
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
