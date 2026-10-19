import React, { useState } from 'react';
import { PageId } from '../types';
import { BRAND_ASSETS } from '../data/mockData';
import { subscribeNewsletter } from '../lib/supabase';

interface FooterProps {
  onNavigate: (page: PageId) => void;
  onOpenSupabaseModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSupabaseModal }) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'disclaimer' | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    await subscribeNewsletter(emailInput.trim());
    setSubscribed(true);
    setEmailInput('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const handleNav = (page: PageId) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="w-full bg-[#0e1c2f] text-[#fefcff] pt-12 md:pt-16 pb-8 border-t border-[#213145]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-[#213145]">
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  alt="Aset Rumah Batam Logo"
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20 shadow-xs"
                  src={BRAND_ASSETS.logoUrl}
                />
                <span className="font-bold text-[20px] text-white tracking-tight">
                  Aset Rumah Batam
                </span>
              </div>
              <p className="text-[14px] text-[#77849c] leading-relaxed max-w-sm">
                Platform broker real estat mewah terakreditasi dan terpercaya di Batam dan sekitarnya. Menyediakan portofolio residensial prestisius, komersial strategis, serta konsultasi investasi bernilai tinggi.
              </p>
              <div className="flex items-center gap-2 text-[#77849c] text-[13px]">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[18px]">verified</span>
                <span>Anggota Resmi AREBI & Terdaftar Berizin Resmi</span>
              </div>
            </div>

            {/* Col 3: Navigasi Cepat */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
                Navigasi Cepat
              </h3>
              <ul className="space-y-2 text-[13px] text-[#77849c]">
                <li>
                  <button
                    onClick={() => handleNav('beranda')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Beranda
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('katalog-properti')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Katalog Properti
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('detail-properti')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Detail Properti
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('panduan-legalitas-uwto')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Panduan & UWTO
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('konsultasi-agen')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Konsultasi Agen
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('tentang-kami')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Tentang Kami
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('titip-properti')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Titip Properti
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNav('faq-bantuan')}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    FAQ & Bantuan
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Kantor Representatif */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
                Kantor Representatif
              </h3>
              <div className="space-y-3 text-[13px] text-[#77849c]">
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold text-white">Batam Main Office</p>
                  <p className="leading-relaxed">
                    {BRAND_ASSETS.address}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-semibold text-white">Layanan Kontak Langsung</p>
                  <p className="leading-relaxed">
                    {BRAND_ASSETS.phone} • {BRAND_ASSETS.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Col 5: Wawasan & Tren Properti */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">
                Wawasan & Tren Properti
              </h3>
              <p className="text-[13px] text-[#77849c]">
                Dapatkan laporan pasar properti Batam dan panduan legalitas UWTO BP Batam langsung ke surel Anda.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex items-center bg-[#213145] rounded-full p-1.5 focus-within:ring-2 focus-within:ring-[#0051d5]">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Surel Anda"
                    className="bg-transparent px-3 text-white text-[13px] focus:outline-none w-full placeholder:text-[#77849c]"
                  />
                  <button
                    type="submit"
                    className="bg-[#0051d5] text-white px-4 py-1.5 rounded-full text-[12px] font-semibold hover:bg-[#316bf3] transition-colors cursor-pointer shrink-0"
                  >
                    Kirim
                  </button>
                </div>
                {subscribed && (
                  <p className="text-[12px] text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Terima kasih! Anda telah terdaftar menerima buletin berkala.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[#77849c] text-[13px]">
            <p>© 2025 Aset Rumah Batam Properti Brokerage. Seluruh hak cipta dilindungi undang-undang.</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {onOpenSupabaseModal && (
                <button
                  type="button"
                  onClick={onOpenSupabaseModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#213145] hover:bg-[#3ecf8e]/20 text-[#3ecf8e] text-[11px] font-bold border border-[#3ecf8e]/30 transition-all cursor-pointer"
                  title="Kelola & pantau koneksi Supabase"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e] animate-pulse"></span>
                  <span>Supabase Database</span>
                </button>
              )}
              <button
                onClick={() => setActiveModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Kebijakan Privasi
              </button>
              <button
                onClick={() => setActiveModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Syarat & Ketentuan
              </button>
              <button
                onClick={() => setActiveModal('disclaimer')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Disklaimer Legalitas
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Info Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-[#0b1c30] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eff4ff] pb-3">
              <h3 className="text-[18px] font-bold text-[#0e1c2f]">
                {activeModal === 'privacy' && 'Kebijakan Privasi'}
                {activeModal === 'terms' && 'Syarat & Ketentuan Layanan'}
                {activeModal === 'disclaimer' && 'Disklaimer Legalitas & UWTO BP Batam'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-[#75777d] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="text-[14px] text-[#44474c] leading-relaxed max-h-80 overflow-y-auto space-y-3 pr-1">
              {activeModal === 'privacy' && (
                <>
                  <p>Aset Rumah Batam berkomitmen menjaga kerahasiaan data pribadi pemilik properti, pencari hunian, dan investor. Data nama, kontak WhatsApp, dan dokumen hak atas tanah semata-mata digunakan untuk verifikasi status kepemilikan dan pencocokan calon pembeli kredibel.</p>
                  <p>Kami tidak pernah menjual data Anda kepada pihak ketiga manapun.</p>
                </>
              )}
              {activeModal === 'terms' && (
                <>
                  <p>Seluruh transaksi difasilitasi dengan pendampingan Notaris/PPAT terakreditasi resmi di wilayah Batam. Komisi broker mengacu pada pedoman standar AREBI (2-3% untuk jual-beli dan 5-8% untuk sewa-menyewa tahunan) dan hanya dibayarkan setelah transaksi selesai di hadapan PPAT.</p>
                </>
              )}
              {activeModal === 'disclaimer' && (
                <>
                  <p>Pulau Batam merupakan kawasan khusus berstatus Free Trade Zone (FTZ) di bawah pengelolaan Badan Pengusahaan (BP) Batam dan Pemerintah Kota Batam. Hak atas tanah di Batam tunduk pada alokasi UWTO (Uang Wajib Tahunan Otorita) yang wajib diperpanjang secara berkala.</p>
                  <p>Aset Rumah Batam melakukan verifikasi faktur dan SK UWTO pada Sistem LMS BP Batam serta status peruntukan Fatwa Planologi, namun verifikasi yuridis final dilakukan oleh Notaris/PPAT rekanan berwenang.</p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-[#0e1c2f] text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-[#0051d5] transition-colors"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
