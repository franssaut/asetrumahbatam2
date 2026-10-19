import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PropertyItem, FaqItem } from '../types';
import { PROPERTIES_LIST, FAQ_LIST } from '../data/mockData';

// Storage keys for runtime configuration
const SUPABASE_URL_KEY = 'arb_supabase_url';
const SUPABASE_KEY_KEY = 'arb_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

export function getSupabaseConfig(): SupabaseConfig {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_URL_KEY) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_KEY_KEY) : null;

  const url = cleanSupabaseUrl(storedUrl || import.meta.env.VITE_SUPABASE_URL || '');
  const anonKey = (storedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return { url, anonKey };
}

export function setSupabaseConfig(config: SupabaseConfig) {
  if (typeof window !== 'undefined') {
    if (config.url) localStorage.setItem(SUPABASE_URL_KEY, config.url);
    else localStorage.removeItem(SUPABASE_URL_KEY);

    if (config.anonKey) localStorage.setItem(SUPABASE_KEY_KEY, config.anonKey);
    else localStorage.removeItem(SUPABASE_KEY_KEY);
  }
  supabaseInstance = null; // Reset cached instance
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || url.includes('your-project') || anonKey.includes('your-anon')) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Test Supabase connectivity
 */
export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const targetUrl = cleanSupabaseUrl(config?.url || getSupabaseConfig().url);
  const targetKey = (config?.anonKey || getSupabaseConfig().anonKey).trim();

  if (!targetUrl || !targetKey || targetUrl.includes('your-project')) {
    return {
      success: false,
      message: 'URL atau Anon Key Supabase belum dikonfigurasi.',
    };
  }

  try {
    const tempClient = createClient(targetUrl, targetKey);
    const { error } = await tempClient.from('property_submissions').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet, but authentication is valid
      if (error.message.includes('relation "property_submissions" does not exist')) {
        return {
          success: true,
          message: 'Terkoneksi ke Supabase! (Tabel belum dibuat, jalankan script SQL yang tersedia)',
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Koneksi ke Supabase berhasil terhubung secara real-time!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghubungi server Supabase' };
  }
}

/**
 * Submit Titip Properti to Supabase
 */
export async function submitPropertyListing(data: {
  ownerName: string;
  ownerWhatsapp: string;
  propertyType: string;
  region: string;
  address: string;
  price: string;
  landArea: number;
  buildingArea: number;
  legalStatus: string;
  uwtoDuration: string;
  notes?: string;
  intent: 'jual' | 'sewa';
}) {
  const client = getSupabase();
  const submissionRecord = {
    owner_name: data.ownerName,
    owner_whatsapp: data.ownerWhatsapp,
    property_type: data.propertyType,
    region: data.region,
    address: data.address,
    estimated_price: data.price,
    land_area: data.landArea,
    building_area: data.buildingArea,
    legal_status: data.legalStatus,
    uwto_duration: data.uwtoDuration,
    notes: data.notes || '',
    intent: data.intent,
    created_at: new Date().toISOString(),
  };

  // Local persistent backup
  try {
    const existing = JSON.parse(localStorage.getItem('arb_local_submissions') || '[]');
    existing.unshift({ ...submissionRecord, id: 'local_' + Date.now() });
    localStorage.setItem('arb_local_submissions', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error(e);
  }

  if (!client) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const { error } = await client.from('property_submissions').insert([submissionRecord]);
    if (error) {
      console.warn('Supabase insert warning, saved locally:', error.message);
      return { success: true, isLocalFallback: true, warning: error.message };
    }
    return { success: true, isLocalFallback: false };
  } catch (err: any) {
    console.error('Supabase error:', err);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Submit Consultation Booking to Supabase
 */
export async function submitConsultationBooking(data: {
  name: string;
  phone: string;
  agentId: string;
  timeSlot: string;
  interests: string;
}) {
  const client = getSupabase();
  const bookingRecord = {
    client_name: data.name,
    whatsapp_number: data.phone,
    agent_id: data.agentId,
    preferred_time_slot: data.timeSlot,
    property_interests: data.interests,
    created_at: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem('arb_local_bookings') || '[]');
    existing.unshift({ ...bookingRecord, id: 'local_' + Date.now() });
    localStorage.setItem('arb_local_bookings', JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error(e);
  }

  if (!client) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const { error } = await client.from('consultation_bookings').insert([bookingRecord]);
    if (error) {
      console.warn('Supabase booking warning, saved locally:', error.message);
      return { success: true, isLocalFallback: true };
    }
    return { success: true, isLocalFallback: false };
  } catch (err) {
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Save Newsletter Subscription
 */
export async function subscribeNewsletter(email: string) {
  const client = getSupabase();

  try {
    const existing = JSON.parse(localStorage.getItem('arb_local_subscribers') || '[]');
    if (!existing.includes(email)) {
      existing.unshift(email);
      localStorage.setItem('arb_local_subscribers', JSON.stringify(existing));
    }
  } catch (e) {
    console.error(e);
  }

  if (!client) return { success: true };

  try {
    await client.from('newsletter_subscribers').insert([{ email, created_at: new Date().toISOString() }]);
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

/**
 * Fetch Properties from Supabase or fallback
 */
function formatPriceRupiah(num: number): string {
  if (num >= 1000000000) {
    return 'Rp ' + (num / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' Miliar';
  } else if (num >= 1000000) {
    return 'Rp ' + (num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' Juta';
  }
  return 'Rp ' + num.toLocaleString('id-ID');
}

function mapSupabasePropertyRow(row: any): PropertyItem {
  const typeMap: Record<string, PropertyItem['category']> = {
    'Rumah': 'Rumah Mewah',
    'Rumah Mewah': 'Rumah Mewah',
    'Townhouse': 'Rumah Mewah',
    'Komersial': 'Ruko Komersial',
    'Ruko': 'Ruko Komersial',
    'Ruko Komersial': 'Ruko Komersial',
    'Apartemen': 'Apartemen',
    'Tanah': 'Tanah Kavling',
    'Tanah Kavling': 'Tanah Kavling',
    'Villa': 'Villa Waterfront',
    'Villa Waterfront': 'Villa Waterfront',
    'Gudang': 'Gudang Industri',
    'Gudang Industri': 'Gudang Industri',
  };

  const rawType = String(row.type || row.category || 'Rumah Mewah');
  const category = typeMap[rawType] || 'Rumah Mewah';

  let district = 'Batam Center';
  const loc = (row.location || '').toLowerCase();
  if (loc.includes('sukajadi')) district = 'Sukajadi';
  else if (loc.includes('nongsa')) district = 'Nongsa';
  else if (loc.includes('nagoya') || loc.includes('jodoh') || loc.includes('lubuk baja')) district = 'Nagoya / Lubuk Baja';
  else if (loc.includes('kabil') || loc.includes('punggur')) district = 'Kabil / Punggur';
  else if (loc.includes('tiban') || loc.includes('sekupang')) district = 'Sekupang / Tiban';
  else if (loc.includes('batam centre') || loc.includes('batam center')) district = 'Batam Center';

  const rawPrice = Number(row.price) || 0;
  const id = String(row.id || '').trim();

  return {
    id: id,
    title: row.title || 'Properti Batam',
    category: category,
    location: row.location || 'Batam, Kepulauan Riau',
    district: district,
    price: rawPrice,
    priceFormatted: formatPriceRupiah(rawPrice),
    intent: (row.intent === 'sewa' ? 'sewa' : 'jual') as 'jual' | 'sewa',
    period: row.period || (row.intent === 'sewa' ? '/ tahun' : undefined),
    landArea: Number(row.area || row.landArea || row.land_area || 120),
    buildingArea: Number(row.buildingArea || row.building_area || row.area || 100),
    bedrooms: row.beds !== undefined && row.beds !== null ? Number(row.beds) : (row.bedrooms !== undefined ? Number(row.bedrooms) : 3),
    bathrooms: row.baths !== undefined && row.baths !== null ? Number(row.baths) : (row.bathrooms !== undefined ? Number(row.bathrooms) : 2),
    uwtoExpiryYear: Number(row.uwtoExpiryYear || row.uwto_expiry_year || 2048),
    uwtoStatus: row.uwtoStatus || row.uwto_status || 'Aktif s/d 2048 (LMS BP Batam Valid)',
    legalStatus: row.legalStatus || row.legal_status || 'Sertifikat HGB Murni (BPN)',
    imageUrl: row.image_url || row.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    additionalImages: row.additional_images || row.additionalImages || [],
    featured: Boolean(row.featured),
    agentName: row.agent_name || row.agentName || 'Hendry Tan',
    agentPhone: row.agent_phone || row.agentPhone || '+62 823-9105-9216',
    agentRole: row.agent_role || row.agentRole || 'Konsultan Properti Batam',
    description: row.description || `Properti prestisius dengan sertifikasi legalitas resmi BP Batam, berlokasi sangat strategis di kawasan ${row.location || 'Batam'}.`,
    facilities: row.facilities || ['Verifikasi Faktur UWTO Clear', 'Jalan Aspal Row Lebar', 'Keamanan 24 Jam', 'Air SPAM & Listrik PLN Stabil'],
  };
}

/**
 * Fetch Properties from Supabase with automatic mapping and fallback
 */
export async function fetchProperties(): Promise<PropertyItem[]> {
  const client = getSupabase();
  if (!client) return PROPERTIES_LIST;

  try {
    const { data, error } = await client.from('properties').select('*').order('id', { ascending: true });
    if (error || !data || data.length === 0) {
      return PROPERTIES_LIST;
    }

    const supabaseProperties = data.map(mapSupabasePropertyRow);
    
    // Merge: Supabase properties first, followed by default mock units that don't share IDs
    const existingIds = new Set(supabaseProperties.map((p) => p.id.toLowerCase()));
    const additionalMocks = PROPERTIES_LIST.filter((p) => !existingIds.has(p.id.toLowerCase()));
    
    return [...supabaseProperties, ...additionalMocks];
  } catch (err) {
    console.warn('Failed to fetch properties from Supabase, falling back to mock data:', err);
    return PROPERTIES_LIST;
  }
}

/**
 * SQL Schema for Supabase Setup
 */
export const SUPABASE_SQL_SCHEMA = `-- Schema database Aset Rumah Batam untuk Supabase
-- Buka Supabase Dashboard > SQL Editor > New query, lalu paste & jalankan script ini:

-- 1. Tabel Pengajuan Titip Properti (Jual & Sewa)
CREATE TABLE IF NOT EXISTS public.property_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_name TEXT NOT NULL,
    owner_whatsapp TEXT NOT NULL,
    property_type TEXT NOT NULL,
    region TEXT NOT NULL,
    address TEXT NOT NULL,
    estimated_price TEXT NOT NULL,
    land_area NUMERIC NOT NULL,
    building_area NUMERIC,
    legal_status TEXT NOT NULL,
    uwto_duration TEXT NOT NULL,
    notes TEXT,
    intent TEXT DEFAULT 'jual' NOT NULL
);

-- 2. Tabel Penjadwalan Temu & Survei Konsultan
CREATE TABLE IF NOT EXISTS public.consultation_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    preferred_time_slot TEXT NOT NULL,
    property_interests TEXT
);

-- 3. Tabel Pelanggan Buletin & Wawasan Properti
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL
);

-- RLS (Row Level Security) - Ijinkan public insert untuk formulir website
ALTER TABLE public.property_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public insert for submissions" ON public.property_submissions
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable public insert for bookings" ON public.consultation_bookings
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable public insert for subscribers" ON public.newsletter_subscribers
    FOR INSERT TO anon WITH CHECK (true);
`;
