import React, { useState, useMemo } from 'react';
import { FAQ_LIST, BRAND_ASSETS } from '../data/mockData';

export const FaqPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');

  const categories = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'uwto', label: 'Legalitas & UWTO' },
    { id: 'kpr', label: 'Beli Properti & KPR' },
    { id: 'titip', label: 'Titip & Jual Properti' },
    { id: 'wna', label: 'Investor & WNA' },
    { id: 'biaya', label: 'Biaya & Pajak' },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answerHtml.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-[#eff4ff] overflow-hidden py-16 md:py-20 border-b border-[#e5eeff]">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#dbe1ff] px-3.5 py-1 rounded-full mb-5 shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-[#00174b]">help</span>
            <span className="text-[11px] font-bold text-[#00174b] uppercase tracking-wider">
              PUSAT BANTUAN & FAQ
            </span>
          </div>

          <h1 className="text-[32px] md:text-[42px] font-extrabold text-[#0e1c2f] leading-tight mb-4 max-w-2xl">
            Pertanyaan yang Sering Diajukan
          </h1>

          <p className="text-[16px] md:text-[18px] text-[#44474c] max-w-2xl mb-8 leading-relaxed">
            Temukan jawaban cepat seputar transaksi, legalitas UWTO, skema KPR perbankan, dan proses titip jual-sewa properti di Batam.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl relative flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(11,25,44,0.06)] p-1.5 border border-[#eff4ff] focus-within:ring-2 focus-within:ring-[#0051d5]">
            <span className="material-symbols-outlined text-[#75777d] ml-3.5 mr-2 text-[22px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan atau topik bantuan... (misal: UWTO, KPR, Fee Notaris)"
              className="w-full bg-transparent text-[15px] text-[#0b1c30] placeholder:text-[#75777d] focus:outline-none pr-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#75777d] hover:text-[#0b1c30] mr-2 p-1"
                title="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-[18px]">clear</span>
              </button>
            )}
            <button
              type="button"
              className="bg-[#0051d5] text-white hover:bg-[#316bf3] px-6 py-2.5 rounded-full text-[14px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              Cari
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 md:py-16 bg-[#f8f9ff]">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none scroll-smooth">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  type="button"
                  className={`px-4 py-2 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0e1c2f] text-white shadow-xs'
                      : 'bg-white text-[#44474c] hover:text-[#0b1c30] hover:bg-[#eff4ff] border border-[#e5eeff]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Accordion FAQ List */}
          <div className="flex flex-col gap-3.5">
            {filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl shadow-[0_1px_4px_rgba(11,25,44,0.04)] border border-[#e5eeff] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    type="button"
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-[#f8f9ff]/60 transition-colors cursor-pointer"
                  >
                    <span className="text-[17px] font-semibold text-[#0e1c2f] leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[#75777d] transition-transform duration-200 text-[24px] shrink-0 ${
                        isOpen ? 'rotate-180 text-[#0051d5]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-[#44474c] text-[15px] leading-relaxed border-t border-[#f0f4ff]">
                      <div
                        dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-[0_1px_4px_rgba(11,25,44,0.04)] border border-[#e5eeff] p-6 space-y-2">
                <span className="material-symbols-outlined text-[#75777d] text-[40px] mb-1">search_off</span>
                <p className="text-[18px] font-bold text-[#0e1c2f]">Pertanyaan tidak ditemukan</p>
                <p className="text-[14px] text-[#44474c] max-w-md mx-auto">
                  Coba gunakan kata kunci lain seperti "UWTO", "KPR", "Sertifikat", atau hubungi tim konsultan kami langsung untuk jawaban personal.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0051d5] hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Callout Help Section */}
      <section className="pb-16 bg-[#f8f9ff]">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-[#e5eeff] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_1px_3px_rgba(11,25,44,0.04)] border border-[#d3e4fe]">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-[20px] md:text-[22px] font-bold text-[#0e1c2f]">
                Belum Menemukan Jawaban yang Anda Cari?
              </h2>
              <p className="text-[14px] text-[#44474c] max-w-xl">
                Tim konsultan properti dan spesialis legalitas kami siap membantu menjawab pertanyaan spesifik Anda secara langsung.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo Aset Rumah Batam, saya ingin konsultasi mengenai properti dan legalitas UWTO')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#0e1c2f] text-white hover:bg-[#213145] px-5 py-3 rounded-full text-[14px] font-semibold transition-colors w-full sm:w-auto text-center shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>WhatsApp ({BRAND_ASSETS.phone})</span>
              </a>
              <a
                href={`tel:${BRAND_ASSETS.phoneRaw}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-[#0e1c2f] hover:bg-[#eff4ff] px-5 py-3 rounded-full text-[14px] font-semibold transition-colors w-full sm:w-auto text-center shadow-[0_1px_3px_rgba(11,25,44,0.05)] border border-[#d3e4fe]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">call</span>
                <span>Hubungi Telepon</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
