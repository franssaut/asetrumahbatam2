import React, { useState, useRef, useEffect } from 'react';
import { PageId, UserProfile } from '../types';
import { BRAND_ASSETS } from '../data/mockData';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems: { id: PageId; label: string }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'katalog-properti', label: 'Katalog Properti' },
    { id: 'panduan-legalitas-uwto', label: 'Panduan & UWTO' },
    { id: 'konsultasi-agen', label: 'Konsultasi Agen' },
    { id: 'tentang-kami', label: 'Tentang Kami' },
    { id: 'titip-properti', label: 'Titip Properti' },
    { id: 'faq-bantuan', label: 'FAQ & Bantuan' },
  ];

  const handleNavClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    setShowProfileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-100 text-rose-800' };
      case 'agent':
      default:
        return { label: 'Agent', color: 'bg-emerald-100 text-emerald-800' };
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eff4ff]">
      <div className="h-20 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 xl:gap-8">
          <button
            onClick={() => handleNavClick('beranda')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <img
              alt="Aset Rumah Batam Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-2xs ring-1 ring-[#0051d5]/15 transition-transform duration-200 group-hover:scale-105"
              src={BRAND_ASSETS.logoUrl}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] text-[#0e1c2f] tracking-tight group-hover:text-[#0051d5] transition-colors leading-tight">
                Aset Rumah Batam
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                Portal Properti & Legalitas Resmi
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-[#0051d5] font-bold bg-[#eff4ff] shadow-[inset_0_0_0_1px_rgba(0,81,213,0.12)]'
                      : 'text-[#44474c] font-medium hover:text-[#0b1c30] hover:bg-[#eff4ff]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Phone, Titip Properti CTA, Auth/User Menu, Mobile Hamburger */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <a
            className="hidden lg:flex items-center gap-1.5 text-[#44474c] hover:text-[#0051d5] px-2.5 py-1.5 transition-colors rounded-full"
            href={`tel:${BRAND_ASSETS.phoneRaw}`}
          >
            <span className="material-symbols-outlined text-[18px] text-[#0051d5]">call</span>
            <span className="text-[12px] font-semibold text-[#0e1c2f]">{BRAND_ASSETS.phone}</span>
          </a>

          <button
            onClick={() => handleNavClick('titip-properti')}
            className="hidden sm:inline-flex items-center justify-center bg-[#0051d5] text-white hover:bg-[#316bf3] text-[13px] font-semibold px-4 py-2 rounded-full transition-all shadow-[0_4px_12px_rgba(0,81,213,0.18)] cursor-pointer active:scale-95"
          >
            Titip Properti
          </button>

          {/* Authentication State Button / User Dropdown */}
          {!user ? (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full border border-[#0051d5]/30 bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white text-[13px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span>Masuk / Daftar</span>
            </button>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full border border-gray-200 hover:border-[#0051d5]/40 hover:bg-[#eff4ff] transition-all cursor-pointer bg-white shadow-2xs"
              >
                <img
                  alt={user.fullName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0051d5]/20"
                  src={
                    user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0051d5&color=fff`
                  }
                />
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <p className="font-bold text-[#0e1c2f] line-clamp-1 max-w-[100px]">
                    {user.fullName.split(' ')[0]}
                  </p>
                  <span className={`text-[10px] font-semibold px-1 rounded ${getRoleBadge(user.role).color}`}>
                    {getRoleBadge(user.role).label}
                  </span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-[18px]">
                  {showProfileMenu ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-[#eff4ff] p-3 text-left z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <img
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200"
                      src={
                        user.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0051d5&color=fff`
                      }
                    />
                    <div className="overflow-hidden">
                      <p className="text-[13px] font-bold text-[#0e1c2f] truncate">{user.fullName}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${getRoleBadge(user.role).color}`}>
                          {getRoleBadge(user.role).label}
                        </span>
                        {user.provider === 'google' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            Google
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="py-2 space-y-1 text-[13px]">
                    <button
                      onClick={() => handleNavClick('dashboard-user')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-[#0051d5] hover:bg-[#eff4ff] font-medium transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#0051d5]">dashboard</span>
                      <span>Dashboard Saya</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavClick('dashboard-user');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-[#0051d5] hover:bg-[#eff4ff] font-medium transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[18px] text-rose-500">favorite</span>
                      <span>Properti Disimpan</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('titip-properti')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 hover:text-[#0051d5] hover:bg-[#eff4ff] font-medium transition-colors cursor-pointer text-left"
                    >
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">add_home</span>
                      <span>Titip Properti</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer text-left text-[13px]"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[#0e1c2f] hover:bg-[#eff4ff] focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[26px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-[#eff4ff] px-4 py-4 space-y-1 shadow-lg max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* User Status Bar in Mobile Drawer */}
          {user ? (
            <div className="p-3 mb-2 rounded-2xl bg-[#eff4ff] border border-[#0051d5]/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                  src={
                    user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0051d5&color=fff`
                  }
                />
                <div>
                  <p className="text-sm font-bold text-[#0e1c2f]">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('dashboard-user');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <div className="pb-3 border-b border-gray-100 mb-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0051d5] text-white font-bold text-[14px] shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
                <span>Masuk / Daftar Akun</span>
              </button>
            </div>
          )}

          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#eff4ff] text-[#0051d5] font-bold'
                    : 'text-[#44474c] hover:bg-[#eff4ff]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                )}
              </button>
            );
          })}

          {user && (
            <button
              onClick={() => handleNavClick('dashboard-user')}
              className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-colors flex items-center justify-between ${
                currentPage === 'dashboard-user'
                  ? 'bg-[#eff4ff] text-[#0051d5] font-bold'
                  : 'text-[#44474c] hover:bg-[#eff4ff]'
              }`}
            >
              <span>Dashboard Profil & Favorit</span>
              <span className="material-symbols-outlined text-[18px]">account_box</span>
            </button>
          )}

          <div className="pt-3 border-t border-[#eff4ff] flex flex-col gap-2">
            <button
              onClick={() => handleNavClick('titip-properti')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0051d5] text-white font-semibold text-[14px] text-center"
            >
              Titip Properti Batam
            </button>
            <a
              href={`tel:${BRAND_ASSETS.phoneRaw}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#eff4ff] text-[#0051d5] font-semibold text-[14px]"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              {BRAND_ASSETS.phone}
            </a>
            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 px-4 rounded-xl bg-red-50 text-red-600 font-semibold text-[13px] text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Keluar dari Akun
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
