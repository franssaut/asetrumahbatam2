import React, { useState, useEffect } from 'react';
import { PageId, PropertyItem } from './types';
import { PROPERTIES_LIST, BRAND_ASSETS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupabaseModal } from './components/SupabaseModal';
import { 
  parseInitialRoute, 
  getPropertyPath, 
  PAGE_PATHS 
} from './lib/navigation';

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

  // Parse initial route on load and handle browser back/forward buttons
  useEffect(() => {
    const handleRouteSync = () => {
      const route = parseInitialRoute(PROPERTIES_LIST);
      setCurrentPage(route.page);
      if (route.property) {
        setSelectedProperty(route.property);
        document.title = `${route.property.title} | Aset Rumah Batam`;
      } else {
        updatePageTitle(route.page);
      }
    };

    // Run on initial page mount
    handleRouteSync();

    // Listen to browser navigation (back / forward)
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, []);

  const updatePageTitle = (page: PageId) => {
    const titles: Record<PageId, string> = {
      'beranda': 'Aset Rumah Batam | Broker Properti Mewah & Legalitas UWTO Resmi',
      'katalog-properti': 'Katalog Properti Pilihan Batam | Aset Rumah Batam',
      'detail-properti': 'Detail Properti | Aset Rumah Batam',
      'panduan-legalitas-uwto': 'Panduan Siklus UWTO BP Batam & Hak Pakai WNA | Aset Rumah Batam',
      'konsultasi-agen': 'Konsultasi Agen & Legalitas Properti Batam | Aset Rumah Batam',
      'tentang-kami': 'Tentang Kami | Broker Terakreditasi Batam',
      'titip-properti': 'Titip Jual & Sewa Properti Batam | Aset Rumah Batam',
      'faq-bantuan': 'Pusat FAQ & Bantuan Legal Properti Batam',
    };
    document.title = titles[page] || 'Aset Rumah Batam';
  };

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    const targetPath = PAGE_PATHS[page] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    updatePageTitle(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProperty = (property: PropertyItem) => {
    setSelectedProperty(property);
    setCurrentPage('detail-properti');
    const targetPath = getPropertyPath(property.id);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    document.title = `${property.title} | Aset Rumah Batam`;
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
