import React, { useState } from 'react';
import { PageId } from '../types';
import { BRAND_ASSETS } from '../data/mockData';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems: { id: PageId; label: string }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'katalog-properti', label: 'Katalog Properti' },
    { id: 'detail-properti', label: 'Detail Properti' },
    { id: 'panduan-legalitas-uwto', label: 'Panduan & UWTO' },
    { id: 'konsultasi-agen', label: 'Konsultasi Agen' },
    { id: 'tentang-kami', label: 'Tentang Kami' },
    { id: 'titip-properti', label: 'Titip Properti' },
    { id: 'faq-bantuan', label: 'FAQ & Bantuan' },
  ];

  const handleNavClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#eff4ff]">
      <div className="h-20 max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 xl:gap-8">
          <button
            onClick={() => handleNavClick('beranda')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <img
              alt="Aset Rumah Batam Logo"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              src={BRAND_ASSETS.logoUrl}
            />
            <span className="font-bold text-[18px] text-[#0e1c2f] tracking-tight group-hover:text-[#0051d5] transition-colors">
              Aset Rumah Batam
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-[14px] px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
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

        {/* Right: Phone, Titip Properti CTA, Avatar, Mobile Hamburger */}
        <div className="flex items-center gap-3 md:gap-4">
          <a
            className="hidden lg:flex items-center gap-1.5 text-[#44474c] hover:text-[#0051d5] px-2.5 py-1.5 transition-colors rounded-full"
            href={`tel:${BRAND_ASSETS.phoneRaw}`}
          >
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">call</span>
            <span className="text-[13px] font-semibold text-[#0e1c2f]">{BRAND_ASSETS.phone}</span>
          </a>

          <button
            onClick={() => handleNavClick('titip-properti')}
            className="inline-flex items-center justify-center bg-[#0051d5] text-white hover:bg-[#316bf3] text-[14px] font-semibold px-5 py-2 rounded-full transition-all shadow-[0_4px_12px_rgba(0,81,213,0.18)] cursor-pointer active:scale-95"
          >
            Titip Properti
          </button>

          {/* Agent avatar badge */}
          <div className="relative flex items-center pl-1">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative focus:outline-none cursor-pointer"
              title="Konsultan Properti Berjaga"
            >
              <img
                alt="Agent Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0051d5]/20 hover:ring-[#0051d5] transition-all"
                src={BRAND_ASSETS.userAvatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#316bf3] rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Popup Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-[#eff4ff] p-3 text-left z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 pb-2 border-b border-[#eff4ff]">
                  <img
                    alt="Agent Profile"
                    className="w-10 h-10 rounded-full object-cover"
                    src={BRAND_ASSETS.userAvatar}
                  />
                  <div>
                    <p className="text-[13px] font-bold text-[#0e1c2f]">Dewi Lestari</p>
                    <p className="text-[11px] text-[#0051d5] font-semibold">Konsultan Siaga Batam</p>
                  </div>
                </div>
                <div className="pt-2 text-[12px] text-[#44474c] space-y-2">
                  <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Online Melayani Konsultasi
                  </p>
                  <a
                    href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo saya ingin konsultasi properti Batam')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full bg-[#0e1c2f] text-white py-2 rounded-lg font-medium hover:bg-[#0051d5] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Chat Langsung via WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[#0e1c2f] hover:bg-[#eff4ff] focus:outline-none"
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
          <div className="pt-3 border-t border-[#eff4ff] flex flex-col gap-2">
            <a
              href={`tel:${BRAND_ASSETS.phoneRaw}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#eff4ff] text-[#0051d5] font-semibold text-[14px]"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              {BRAND_ASSETS.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
