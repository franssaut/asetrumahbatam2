import React, { useState, useEffect } from 'react';
import { UserProfile, PropertyItem, PageId } from '../types';
import { 
  getFavoritePropertyIds, 
  toggleFavoriteProperty, 
  signOutUser, 
  demoLogin, 
  updateUserProfile, 
  updateUserPassword 
} from '../lib/auth';
import { getSupabase } from '../lib/supabase';
import { getPropertyPath } from '../lib/navigation';

interface DashboardUserPageProps {
  user: UserProfile;
  properties: PropertyItem[];
  onNavigate: (page: PageId) => void;
  onSelectProperty: (property: PropertyItem) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

interface LocalSubmission {
  id?: string;
  user_id?: string;
  property_type?: string;
  region?: string;
  address?: string;
  estimated_price?: string;
  legal_status?: string;
  uwto_duration?: string;
  created_at?: string;
  intent?: string;
}

interface LocalBooking {
  id?: string;
  user_id?: string;
  client_name?: string;
  whatsapp_number?: string;
  agent_id?: string;
  preferred_time_slot?: string;
  property_interests?: string;
  created_at?: string;
}

export const DashboardUserPage: React.FC<DashboardUserPageProps> = ({
  user,
  properties,
  onNavigate,
  onSelectProperty,
  onLogout,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'favorites' | 'submissions' | 'bookings' | 'profile'>('favorites');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<LocalSubmission[]>([]);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);

  // Profile Edit States
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editRole, setEditRole] = useState<UserProfile['role']>(user.role);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when user prop changes
  useEffect(() => {
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
  }, [user]);

  // Load user data on mount & query Supabase
  useEffect(() => {
    // 1. Favorites
    setFavoriteIds(getFavoritePropertyIds());

    // 2. Submissions (Local + Supabase)
    const loadSubmissions = async () => {
      let localList: LocalSubmission[] = [];
      try {
        localList = JSON.parse(localStorage.getItem('arb_local_submissions') || '[]');
      } catch (e) {}

      const client = getSupabase();
      if (client) {
        try {
          const { data: dbSubmissions } = await client
            .from('property_submissions')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbSubmissions && dbSubmissions.length > 0) {
            const userDbSubs = dbSubmissions.filter((s: any) =>
              s.user_id === user.id ||
              (user.phone && s.owner_whatsapp === user.phone) ||
              (s.owner_name && s.owner_name.toLowerCase().includes(user.fullName.toLowerCase()))
            );
            if (userDbSubs.length > 0) {
              setSubmissions(userDbSubs);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase submissions query notice:', err);
        }
      }

      if (localList.length > 0) {
        setSubmissions(localList);
      } else {
        setSubmissions([
          {
            id: 'sub-sample-01',
            property_type: 'Rumah Mewah Hook',
            region: 'Batam Kota',
            address: 'Sukajadi Residence Blok B3, Batam Kota',
            estimated_price: 'Rp 3.850.000.000',
            legal_status: 'SHGB',
            uwto_duration: 'Tahun 2046',
            intent: 'jual',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
        ]);
      }
    };

    // 3. Bookings (Local + Supabase)
    const loadBookings = async () => {
      let localList: LocalBooking[] = [];
      try {
        localList = JSON.parse(localStorage.getItem('arb_local_bookings') || '[]');
      } catch (e) {}

      const client = getSupabase();
      if (client) {
        try {
          const { data: dbBookings } = await client
            .from('consultation_bookings')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbBookings && dbBookings.length > 0) {
            const userDbBookings = dbBookings.filter((b: any) =>
              b.user_id === user.id ||
              (user.phone && b.whatsapp_number === user.phone) ||
              (b.client_name && b.client_name.toLowerCase().includes(user.fullName.toLowerCase()))
            );
            if (userDbBookings.length > 0) {
              setBookings(userDbBookings);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase bookings query notice:', err);
        }
      }

      if (localList.length > 0) {
        setBookings(localList);
      } else {
        setBookings([
          {
            id: 'book-sample-01',
            client_name: user.fullName,
            whatsapp_number: user.phone || '+62 812-7000-8812',
            agent_id: 'Dewi Lestari (Senior Legal Consultant)',
            preferred_time_slot: 'Besok Pagi (10:00 - 11:30 WIB)',
            property_interests: 'Konsultasi Perpanjangan UWTO & Investasi Villa Nongsa',
            created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          },
        ]);
      }
    };

    loadSubmissions();
    loadBookings();
  }, [user]);

  // Favorite properties list
  const favoriteProperties = properties.filter((p) => favoriteIds.includes(p.id));

  const handleRemoveFavorite = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = toggleFavoriteProperty(propertyId);
    setFavoriteIds(res.favorites);
  };

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'agen':
        return { label: 'Konsultan Agen ARB', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'investor':
        return { label: 'Investor Prioritas', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'admin':
        return { label: 'Administrator Portal', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: 'Klien Pembeli / Penjual', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-[#eff4ff] mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0051d5&color=fff`}
                  alt={user.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-[#0051d5]/15 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white" title="Akun Aktif">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#0e1c2f] tracking-tight">
                    {user.fullName}
                  </h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#44474c] mt-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">mail</span>
                  {user.email}
                  {user.phone && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="material-symbols-outlined text-[16px] text-gray-400">phone</span>
                      {user.phone}
                    </>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  ID Pengguna: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600">{user.id}</code>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('titip-properti')}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] hover:bg-[#316bf3] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,81,213,0.2)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_home</span>
                Titip Properti Baru
              </button>

              <button
                onClick={async () => {
                  await signOutUser();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Keluar
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
            <div className="bg-[#eff4ff]/60 rounded-2xl p-4 border border-[#0051d5]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Favorit Tersimpan</span>
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">favorite</span>
              </div>
              <p className="text-2xl font-bold text-[#0e1c2f] mt-1">{favoriteIds.length}</p>
            </div>

            <div className="bg-[#eff4ff]/60 rounded-2xl p-4 border border-[#0051d5]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Pengajuan Listing</span>
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">real_estate_agent</span>
              </div>
              <p className="text-2xl font-bold text-[#0e1c2f] mt-1">{submissions.length}</p>
            </div>

            <div className="bg-[#eff4ff]/60 rounded-2xl p-4 border border-[#0051d5]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Konsultasi Terjadwal</span>
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">event_available</span>
              </div>
              <p className="text-2xl font-bold text-[#0e1c2f] mt-1">{bookings.length}</p>
            </div>

            <div className="bg-[#eff4ff]/60 rounded-2xl p-4 border border-[#0051d5]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Status Akun</span>
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
              </div>
              <p className="text-sm font-bold text-emerald-700 mt-2">Aktif & Terverifikasi</p>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#0051d5] text-white shadow-md'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            Properti Favorit ({favoriteIds.length})
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'submissions'
                ? 'bg-[#0051d5] text-white shadow-md'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Listing Diajukan ({submissions.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#0051d5] text-white shadow-md'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Jadwal Konsultasi ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#0051d5] text-white shadow-md'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Profil & Demo Role
          </button>
        </div>

        {/* TAB 1: FAVORITES */}
        {activeTab === 'favorites' && (
          <div>
            {favoriteProperties.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#eff4ff] shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[32px]">favorite_border</span>
                </div>
                <h3 className="text-lg font-bold text-[#0e1c2f]">Belum Ada Properti yang Disimpan</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Tandai properti impian Anda di katalog dengan tombol favorit agar mudah ditinjau kembali kapan saja.
                </p>
                <button
                  onClick={() => onNavigate('katalog-properti')}
                  className="mt-6 inline-flex items-center gap-2 bg-[#0051d5] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#316bf3] shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  Buka Katalog Properti Batam
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 border border-[#eff4ff] flex flex-col group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#0e1c2f]/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                        {prop.category}
                      </span>
                      <button
                        onClick={(e) => handleRemoveFavorite(prop.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                        title="Hapus dari Favorit"
                      >
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-[#0051d5] flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {prop.location}, {prop.district}
                        </div>
                        <a
                          href={getPropertyPath(prop.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProperty(prop);
                          }}
                          className="font-bold text-base text-[#0e1c2f] hover:text-[#0051d5] transition-colors line-clamp-1 cursor-pointer"
                        >
                          {prop.title}
                        </a>
                        <p className="text-lg font-extrabold text-[#0051d5] mt-2">
                          {prop.priceFormatted}
                          {prop.period && <span className="text-xs font-normal text-gray-500">{prop.period}</span>}
                        </p>

                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 my-3 text-[11px] text-gray-600 text-center">
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.landArea} m²</span>
                            <span>Tanah</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.buildingArea} m²</span>
                            <span>Bangunan</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.uwtoExpiryYear}</span>
                            <span>UWTO</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <a
                          href={getPropertyPath(prop.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProperty(prop);
                          }}
                          className="flex-1 py-2 text-center rounded-xl bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Lihat Detail
                        </a>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya tertarik dengan listing ${prop.title} (${prop.priceFormatted}): ${window.location.origin}${getPropertyPath(prop.id)}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Bagikan via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#0e1c2f]">
                Riwayat Pengajuan Titip Properti ({submissions.length})
              </h2>
              <button
                onClick={() => onNavigate('titip-properti')}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#316bf3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Ajukan Titip Jual / Sewa
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#eff4ff]">
                <p className="text-sm text-gray-500">Belum ada pengajuan listing properti.</p>
              </div>
            ) : (
              submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#eff4ff] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0051d5] uppercase">
                        {sub.intent || 'Jual'}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Sedang Diverifikasi Tim Legal ARB
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0e1c2f] text-base sm:text-lg">{sub.property_type || 'Properti Batam'}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">pin_drop</span>
                      {sub.address || sub.region}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span>Perkiraan Harga: <strong className="text-[#0e1c2f]">{sub.estimated_price}</strong></span>
                      <span>Legalitas: <strong className="text-[#0e1c2f]">{sub.legal_status}</strong></span>
                      {sub.uwto_duration && <span>UWTO: <strong className="text-[#0e1c2f]">{sub.uwto_duration}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/628117788990?text=${encodeURIComponent(`Halo Tim ARB, saya ingin cek progres verifikasi pengajuan properti saya: ${sub.property_type} di ${sub.address || sub.region}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      Tanya Tim Legal
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#0e1c2f]">
                Jadwal Konsultasi & Pendampingan Notaris ({bookings.length})
              </h2>
              <button
                onClick={() => onNavigate('konsultasi-agen')}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#316bf3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Pilih Jadwal Konsultasi
              </button>
            </div>

            {bookings.map((book, idx) => (
              <div
                key={book.id || idx}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#eff4ff] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {book.preferred_time_slot || 'Segera Dikonfirmasi'}
                  </span>
                  <h3 className="font-bold text-[#0e1c2f] text-base">
                    Konsultasi bersama: {book.agent_id || 'Konsultan Spesialis Batam'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Topik Diskusi: <strong>{book.property_interests || 'Legalitas UWTO & Rekomendasi Unit'}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    No. WhatsApp Terdaftar: {book.whatsapp_number}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/628117788990?text=${encodeURIComponent(`Halo Konsultan ARB, saya ${user.fullName} ingin konfirmasi jadwal konsultasi properti saya.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Buka WhatsApp Agen
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PROFILE & DEMO SWITCHER */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supabase Profile Edit Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff] space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[22px]">manage_accounts</span>
                  <h3 className="text-base font-bold text-[#0e1c2f]">Kelola Profil & Supabase Auth</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Supabase Live
                </span>
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {profileMsg.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingProfile(true);
                  setProfileMsg(null);
                  try {
                    const res = await updateUserProfile({
                      fullName: editFullName,
                      phone: editPhone,
                      role: editRole,
                    });
                    if (res.success && res.user) {
                      onUpdateUser(res.user);
                      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui di Supabase database!' });
                    } else {
                      setProfileMsg({ type: 'error', text: res.message || 'Gagal menyimpan profil.' });
                    }
                  } catch (err: any) {
                    setProfileMsg({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Email Terdaftar (Supabase Auth)</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Email terikat ke akun Supabase Auth Anda.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Peran Akun</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserProfile['role'])}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  >
                    <option value="klien">👤 Klien (Pembeli / Penjual Properti)</option>
                    <option value="agen">👔 Agen (Konsultan Properti Resmi)</option>
                    <option value="investor">💼 Investor (Pemodal Real Estat)</option>
                    <option value="admin">🛡️ Administrator (Akses Penuh Portal)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Simpan Perubahan ke Supabase</span>
                    </>
                  )}
                </button>
              </form>

              {/* Password Change Form */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0e1c2f] uppercase tracking-wider mb-2">Ganti Kata Sandi Akun</h4>
                
                {passwordMsg && (
                  <div
                    className={`p-3 mb-3 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {passwordMsg.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPassword.length < 6) {
                      setPasswordMsg({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
                      return;
                    }
                    setSavingPassword(true);
                    setPasswordMsg(null);
                    try {
                      const res = await updateUserPassword(newPassword);
                      if (res.success) {
                        setPasswordMsg({ type: 'success', text: res.message });
                        setNewPassword('');
                      } else {
                        setPasswordMsg({ type: 'error', text: res.message });
                      }
                    } catch (err: any) {
                      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
                    } finally {
                      setSavingPassword(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kata sandi baru (min. 6 karakter)"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2 px-4 rounded-xl bg-gray-900 hover:bg-[#0051d5] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi di Supabase'}
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Demo Switcher for Testing Roles */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff]">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">switch_account</span>
                <h3 className="text-base font-bold text-[#0e1c2f]">Ganti Peran Demo (Testing)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Anda dapat beralih peran seketika untuk menguji tampilan portal dari sudut pandang Klien, Agen, Investor, atau Admin.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => onUpdateUser(demoLogin('klien'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'klien' ? 'border-[#0051d5] bg-blue-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">👤 Budi Santoso (Klien Prioritas)</p>
                    <p className="text-[11px] text-gray-500">Mencari rumah mewah & investasi di Batam</p>
                  </div>
                  {user.role === 'klien' && <span className="text-xs text-[#0051d5] font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('agen'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'agen' ? 'border-emerald-500 bg-emerald-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">👔 Hendra Wijaya (Konsultan Agen)</p>
                    <p className="text-[11px] text-gray-500">Spesialis legalitas UWTO BP Batam</p>
                  </div>
                  {user.role === 'agen' && <span className="text-xs text-emerald-600 font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('investor'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'investor' ? 'border-purple-500 bg-purple-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">💼 Michael Tan (Investor Internasional)</p>
                    <p className="text-[11px] text-gray-500">Fokus pada ruko komersial & lahan industri</p>
                  </div>
                  {user.role === 'investor' && <span className="text-xs text-purple-600 font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('admin'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'admin' ? 'border-rose-500 bg-rose-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">🛡️ Admin Utama (Administrator)</p>
                    <p className="text-[11px] text-gray-500">Akses penuh pengelolaan listing & pengguna</p>
                  </div>
                  {user.role === 'admin' && <span className="text-xs text-rose-600 font-bold">Sedang Aktif</span>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
