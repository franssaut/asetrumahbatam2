import React, { useState } from 'react';
import { PageId, PropertyItem } from './types';
import { PROPERTIES_LIST, BRAND_ASSETS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupabaseModal } from './components/SupabaseModal';

import { BerandaPage } from './pages/BerandaPage';
import { KatalogPropertiPage } from './pages/KatalogPropertiPage';
import { DetailPropertiPage } from './pages/DetailPropertiPage';
import { PanduanUwtoPage } from './pages/PanduanUwtoPage';
import { KonsultasiAgenPage } from './pages/KonsultasiAgenPage';
import { TentangKamiPage } from './pages/TentangKamiPage';
import { TitipPropertiPage } from './pages/TitipPropertiPage';
import { FaqPage } from './pages/FaqPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('beranda');
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem>(PROPERTIES_LIST[0]);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProperty = (property: PropertyItem) => {
    setSelectedProperty(property);
    setCurrentPage('detail-properti');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#dbe1ff] selection:text-[#00174b]">
      {/* Top Header Navigation */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Screen Content */}
      <main className="w-full pt-20 bg-[#f8f9ff] flex-1">
        {currentPage === 'beranda' && (
          <BerandaPage
            onNavigate={handleNavigate}
            onSelectProperty={handleSelectProperty}
          />
        )}

        {currentPage === 'katalog-properti' && (
          <KatalogPropertiPage onSelectProperty={handleSelectProperty} />
        )}

        {currentPage === 'detail-properti' && (
          <DetailPropertiPage
            property={selectedProperty}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'panduan-legalitas-uwto' && (
          <PanduanUwtoPage />
        )}

        {currentPage === 'konsultasi-agen' && (
          <KonsultasiAgenPage onSelectProperty={handleSelectProperty} />
        )}

        {currentPage === 'tentang-kami' && (
          <TentangKamiPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'titip-properti' && (
          <TitipPropertiPage />
        )}

        {currentPage === 'faq-bantuan' && (
          <FaqPage />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      {/* Supabase Integration & Schema Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

      {/* Floating Quick Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        <a
          href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo Aset Rumah Batam, saya ingin bertanya tentang properti')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#0051d5] hover:bg-[#316bf3] text-white pl-4 pr-5 py-3 rounded-full shadow-[0_6px_20px_rgba(0,81,213,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold text-[13px]"
          title="Konsultasi WhatsApp 24/7"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          <span className="hidden sm:inline">WhatsApp Konsultan</span>
        </a>
      </div>
    </div>
  );
}
