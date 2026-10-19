import React, { useState, useEffect } from 'react';
import { PageId, PropertyItem, UserProfile } from './types';
import { PROPERTIES_LIST, BRAND_ASSETS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { fetchProperties } from './lib/supabase';
import { getStoredUser, signOutUser, demoLogin, initSupabaseAuth } from './lib/auth';
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
import { DashboardUserPage } from './pages/DashboardUserPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('beranda');
  const [properties, setProperties] = useState<PropertyItem[]>(PROPERTIES_LIST);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem>(PROPERTIES_LIST[0]);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());

  // Listen to Supabase auth events & local changes
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      const user = e.detail !== undefined ? e.detail : getStoredUser();
      setCurrentUser(user);
    };

    window.addEventListener('arb_auth_changed', handleAuthChange);
    const unsubscribeSupabase = initSupabaseAuth((user) => {
      setCurrentUser(user);
    });

    return () => {
      window.removeEventListener('arb_auth_changed', handleAuthChange);
      unsubscribeSupabase();
    };
  }, []);

  // Load properties from Supabase & synchronize route
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      try {
        const liveProperties = await fetchProperties();
        if (!isMounted) return;
        setProperties(liveProperties);
        setLoadingProperties(false);

        // Resolve current route based on live Supabase properties
        const route = parseInitialRoute(liveProperties);
        setCurrentPage(route.page);
        if (route.property) {
          setSelectedProperty(route.property);
          document.title = `${route.property.title} | Aset Rumah Batam`;
        } else {
          updatePageTitle(route.page);
        }
      } catch (e) {
        console.warn('Error loading initial Supabase properties:', e);
        if (isMounted) setLoadingProperties(false);
      }
    }

    initializeData();

    // Listen to browser navigation (back / forward)
    const handlePopState = () => {
      setProperties((currentProps) => {
        const route = parseInitialRoute(currentProps);
        setCurrentPage(route.page);
        if (route.property) {
          setSelectedProperty(route.property);
          document.title = `${route.property.title} | Aset Rumah Batam`;
        } else {
          updatePageTitle(route.page);
        }
        return currentProps;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
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
      'dashboard-user': 'Dashboard Pengguna & Properti Favorit | Aset Rumah Batam',
      'login': 'Masuk & Daftar Akun Agent | Aset Rumah Batam',
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

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    if (currentPage === 'dashboard-user') {
      handleNavigate('beranda');
    }
  };

  const handleAddProperty = (newProperty: PropertyItem) => {
    setProperties((prev) => [newProperty, ...prev.filter((p) => p.id.toLowerCase() !== newProperty.id.toLowerCase())]);
  };

  const handleEditProperty = (updatedProperty: PropertyItem) => {
    setProperties((prev) => prev.map((p) => (p.id.toLowerCase() === updatedProperty.id.toLowerCase() ? updatedProperty : p)));
    if (selectedProperty && selectedProperty.id.toLowerCase() === updatedProperty.id.toLowerCase()) {
      setSelectedProperty(updatedProperty);
    }
  };

  const handleDeleteProperty = (propertyId: string) => {
    setProperties((prev) => prev.filter((p) => p.id.toLowerCase() !== propertyId.toLowerCase()));
    if (selectedProperty && selectedProperty.id.toLowerCase() === propertyId.toLowerCase()) {
      setSelectedProperty(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#dbe1ff] selection:text-[#00174b]">
      {/* Top Header Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={currentUser}
        onOpenAuth={() => handleNavigate('login')}
        onLogout={handleLogout}
      />

      {/* Main Screen Content */}
      <main className="w-full pt-20 bg-[#f8f9ff] flex-1">
        {currentPage === 'beranda' && (
          <BerandaPage
            properties={properties}
            onNavigate={handleNavigate}
            onSelectProperty={handleSelectProperty}
          />
        )}

        {currentPage === 'katalog-properti' && (
          <KatalogPropertiPage 
            properties={properties}
            loading={loadingProperties}
            onSelectProperty={handleSelectProperty} 
          />
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

        {currentPage === 'dashboard-user' && (
          currentUser ? (
            <DashboardUserPage
              user={currentUser}
              properties={properties}
              onNavigate={handleNavigate}
              onSelectProperty={handleSelectProperty}
              onLogout={handleLogout}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onAddProperty={handleAddProperty}
              onEditProperty={handleEditProperty}
              onDeleteProperty={handleDeleteProperty}
            />
          ) : (
            <div className="max-w-xl mx-auto my-16 px-4">
              <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#eff4ff] text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[36px]">lock</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0e1c2f]">
                  Silakan Masuk ke Akun Anda
                </h2>
                <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                  Akses dashboard pribadi untuk melihat properti favorit tersimpan, riwayat pengajuan titip jual/sewa, dan jadwal konsultasi.
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    onClick={() => handleNavigate('login')}
                    className="w-full py-3 px-6 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Masuk / Daftar Akun</span>
                  </button>

                  <div className="pt-2">
                    <p className="text-xs text-gray-400 mb-2">Atau coba demo instan:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setCurrentUser(demoLogin('agent'))}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        Demo Agent
                      </button>
                      <button
                        onClick={() => setCurrentUser(demoLogin('admin'))}
                        className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
                      >
                        Demo Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {currentPage === 'login' && (
          <LoginPage
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              handleNavigate('dashboard-user');
            }}
            onLogout={handleLogout}
            onOpenSupabaseModal={() => setShowSupabaseModal(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
        onOpenSupabaseModal={() => {
          setShowAuthModal(false);
          setShowSupabaseModal(true);
        }}
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
