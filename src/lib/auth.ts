import { getSupabase } from './supabase';
import { UserProfile } from '../types';

const AUTH_STORAGE_KEY = 'arb_auth_user';
const FAVORITES_STORAGE_KEY = 'arb_favorite_properties';

// Preset Demo Accounts for testing different user roles
export const DEMO_USERS: Record<UserProfile['role'], UserProfile> = {
  klien: {
    id: 'demo-klien-01',
    email: 'budi.santoso@gmail.com',
    fullName: 'Budi Santoso',
    phone: '+62 812-7000-8812',
    role: 'klien',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: '2025-01-15T08:30:00Z',
  },
  agen: {
    id: 'demo-agen-02',
    email: 'hendra.wijaya@asetrumahbatam.com',
    fullName: 'Hendra Wijaya, S.T.',
    phone: '+62 811-7788-990',
    role: 'agen',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
    createdAt: '2024-06-10T10:00:00Z',
  },
  investor: {
    id: 'demo-investor-03',
    email: 'michael.tan@singapore-invest.sg',
    fullName: 'Michael Tan',
    phone: '+65 9123 4567',
    role: 'investor',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    createdAt: '2024-11-20T14:15:00Z',
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
 * Sign in user with email & password (Supabase Auth with Demo & Local Fallback)
 */
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if email matches demo accounts for instant login
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
        const metadata = data.user.user_metadata || {};
        const user: UserProfile = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          fullName: metadata.full_name || metadata.name || cleanEmail.split('@')[0],
          phone: metadata.phone || '',
          role: metadata.role || 'klien',
          createdAt: data.user.created_at,
          avatarUrl: metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.full_name || cleanEmail)}&background=0051d5&color=fff`,
        };
        setStoredUser(user);
        return { success: true, user };
      }

      if (error) {
        // If Supabase returns invalid login credentials or error
        return { success: false, message: error.message };
      }
    } catch (err: any) {
      console.warn('Supabase auth request error:', err);
    }
  }

  // 3. Fallback: Check local registered users list
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> = 
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    
    const found = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.password === password) {
        setStoredUser(found.profile);
        return { success: true, user: found.profile };
      } else {
        return { success: false, message: 'Kata sandi tidak cocok. Silakan coba lagi.' };
      }
    }
  } catch (e) {
    console.error(e);
  }

  return {
    success: false,
    message: 'Email belum terdaftar atau kata sandi salah. Anda juga bisa mencoba Akun Demo 1-Klik di bawah.',
  };
}

/**
 * Register user with email, password, full name, phone, and role
 */
export async function signUpWithEmail(data: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserProfile['role'];
}): Promise<{ success: boolean; user?: UserProfile; message?: string; needsVerification?: boolean }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const role = data.role || 'klien';
  const fullName = data.fullName.trim();
  const phone = data.phone?.trim() || '';

  const newProfile: UserProfile = {
    id: 'user_' + Date.now(),
    email: cleanEmail,
    fullName,
    phone,
    role,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0051d5&color=fff`,
    createdAt: new Date().toISOString(),
  };

  // Always save locally so user can immediately use portal even without SMTP confirmation
  try {
    const registeredUsers: Array<{ email: string; password: string; profile: UserProfile }> =
      JSON.parse(localStorage.getItem('arb_registered_users') || '[]');
    
    const existingIndex = registeredUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      registeredUsers[existingIndex] = { email: cleanEmail, password: data.password, profile: newProfile };
    } else {
      registeredUsers.push({ email: cleanEmail, password: data.password, profile: newProfile });
    }
    localStorage.setItem('arb_registered_users', JSON.stringify(registeredUsers));
  } catch (e) {
    console.error(e);
  }

  // Attempt Supabase Auth registration
  const supabase = getSupabase();
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

      if (!error && authData?.user) {
        newProfile.id = authData.user.id;
        // If session exists immediately, log in
        if (authData.session) {
          setStoredUser(newProfile);
          return { success: true, user: newProfile };
        }
      }
    } catch (err: any) {
      console.warn('Supabase signUp error:', err);
    }
  }

  // Auto-login registered user for smooth experience
  setStoredUser(newProfile);
  return { success: true, user: newProfile };
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
    return stored ? JSON.parse(stored) : ['prop-01', 'prop-04']; // default samples
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
