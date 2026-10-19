import React, { useState, useMemo } from 'react';
import { PropertyItem } from '../types';
import { PROPERTIES_LIST } from '../data/mockData';
import { getPropertyPath, copyPropertyLinkToClipboard } from '../lib/navigation';
import { ShareListingModal } from '../components/ShareListingModal';

interface KatalogPropertiPageProps {
  properties?: PropertyItem[];
  loading?: boolean;
  onSelectProperty: (property: PropertyItem) => void;
}

export const KatalogPropertiPage: React.FC<KatalogPropertiPageProps> = ({ 
  properties: propsList,
  loading = false,
  onSelectProperty 
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'jual' | 'sewa'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModalProperty, setShareModalProperty] = useState<PropertyItem | null>(null);

  const activeProperties = useMemo(() => {
    const raw = propsList && propsList.length > 0 ? propsList : PROPERTIES_LIST;
    return raw.filter((p) => !p.status || p.status === 'published');
  }, [propsList]);

  const handleCopyCardLink = async (e: React.MouseEvent, propId: string) => {
    e.stopPropagation();
    const success = await copyPropertyLinkToClipboard(propId);
    if (success) {
      setCopiedId(propId);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleOpenShare = (e: React.MouseEvent, prop: PropertyItem) => {
    e.stopPropagation();
    setShareModalProperty(prop);
  };

  const districts = [
    { id: 'all', label: 'Semua Kawasan' },
    { id: 'Sukajadi', label: 'Sukajadi' },
    { id: 'Batam Center', label: 'Batam Center' },
    { id: 'Nagoya / Lubuk Baja', label: 'Nagoya' },
    { id: 'Nongsa', label: 'Nongsa' },
    { id: 'Sekupang / Tiban', label: 'Sekupang / Tiban' },
    { id: 'Batu Aji / Marina', label: 'Batu Aji / Marina' },
    { id: 'Kabil / Punggur', label: 'Kabil' },
  ];

  const categories = [
    { id: 'all', label: 'Semua Tipe' },
    { id: 'Perumahan Residensial', label: 'Perumahan Residensial' },
    { id: 'Rumah Mewah', label: 'Rumah Mewah' },
    { id: 'Villa Waterfront', label: 'Villa Waterfront' },
    { id: 'Ruko Komersial', label: 'Ruko Komersial' },
    { id: 'Apartemen', label: 'Apartemen' },
    { id: 'Tanah Kavling', label: 'Tanah Kavling' },
    { id: 'Gudang Industri', label: 'Gudang Industri' },
  ];

  const filteredProperties = useMemo(() => {
    let list = activeProperties.filter((item) => {
      const matchDistrict = selectedDistrict === 'all' || item.district === selectedDistrict;
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchIntent = selectedIntent === 'all' || item.intent === selectedIntent;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      return matchDistrict && matchCategory && matchIntent && matchSearch;
    });

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [activeProperties, selectedDistrict, selectedCategory, selectedIntent, sortBy, searchQuery]);

  return (
    <div className="w-full flex flex-col bg-[#f8f9ff] py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5eeff] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
                Listing Terverifikasi
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase Live Connected</span>
              </span>
            </div>
            <h1 className="text-[28px] md:text-[38px] font-extrabold text-[#0e1c2f] tracking-tight">
              Katalog Properti Pilihan di Batam
            </h1>
            <p className="text-[14px] text-[#44474c] mt-1">
              Setiap listing dilengkapi hyperlink langsung yang siap Anda bagikan ke klien atau pembeli potensial.
            </p>
          </div>

          <div className="text-[13px] text-[#75777d]">
            Menampilkan <strong className="text-[#0e1c2f]">{filteredProperties.length}</strong> unit aktif
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#75777d] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari nama cluster, jalan, atau kawasan di Batam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#eff4ff] pl-11 pr-4 py-2.5 rounded-xl text-[13px] text-[#0e1c2f] focus:bg-white focus:outline-none border border-transparent focus:border-[#0051d5] transition-all placeholder:text-[#75777d]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#75777d] hover:text-[#0e1c2f]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Jual / Sewa Switcher */}
            <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl w-full md:w-auto">
              <button
                type="button"
                onClick={() => setSelectedIntent('all')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedIntent === 'all'
                    ? 'bg-[#0e1c2f] text-white shadow-xs'
                    : 'text-[#44474c] hover:text-[#0b1c30]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedIntent('jual')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedIntent === 'jual'
                    ? 'bg-[#0e1c2f] text-white shadow-xs'
                    : 'text-[#44474c] hover:text-[#0b1c30]'
                }`}
              >
                Dijual
              </button>
              <button
                type="button"
                onClick={() => setSelectedIntent('sewa')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedIntent === 'sewa'
                    ? 'bg-[#0e1c2f] text-white shadow-xs'
                    : 'text-[#44474c] hover:text-[#0b1c30]'
                }`}
              >
                Disewa
              </button>
            </div>
          </div>

          {/* Bottom row: Dropdowns for District, Category, Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#eff4ff]">
            <div>
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-1">
                Kawasan di Batam
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none border border-transparent focus:border-[#0051d5] cursor-pointer"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-1">
                Tipe Properti
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none border border-transparent focus:border-[#0051d5] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider block mb-1">
                Urutan Harga
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-[#eff4ff] text-[#0b1c30] text-[13px] font-semibold rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none border border-transparent focus:border-[#0051d5] cursor-pointer"
              >
                <option value="recommended">Rekomendasi</option>
                <option value="price-asc">Harga: Terendah ke Tertinggi</option>
                <option value="price-desc">Harga: Tertinggi ke Terendah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-[#0051d5] text-[14px] font-semibold">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>Memuat listing properti langsung dari database Supabase...</span>
          </div>
        )}

        {/* Property Cards Grid with Native Hyperlinks */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => {
              const propertyHref = getPropertyPath(prop.id);

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-[#e5eeff] flex flex-col justify-between group"
                >
                  {/* Clickable Image Hyperlink */}
                  <a
                    href={propertyHref}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectProperty(prop);
                    }}
                    className="relative aspect-[16/11] overflow-hidden bg-slate-100 block cursor-pointer"
                    title={`Lihat detail ${prop.title}`}
                  >
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#0e1c2f]/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {prop.category}
                    </div>
                    
                    {/* Action Badges: UWTO & Share Actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCardLink(e, prop.id)}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                          copiedId === prop.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/90 text-[#0e1c2f] hover:bg-white hover:text-[#0051d5]'
                        }`}
                        title={copiedId === prop.id ? 'Tersalin!' : 'Salin tautan listing ini'}
                      >
                        <span className="material-symbols-outlined text-[15px] block">
                          {copiedId === prop.id ? 'check' : 'link'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenShare(e, prop)}
                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#0e1c2f] hover:bg-white hover:text-[#0051d5] transition-all shadow-xs cursor-pointer"
                        title="Bagikan listing ke WA / medsos"
                      >
                        <span className="material-symbols-outlined text-[15px] block">share</span>
                      </button>

                      <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        <span>UWTO OK</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-white/95 backdrop-blur-md text-[#0e1c2f] text-[14px] font-extrabold px-3 py-1 rounded-full shadow-xs">
                        {prop.priceFormatted} {prop.period || ''}
                      </span>
                      <span className="bg-[#0e1c2f]/85 backdrop-blur-md text-white/90 font-mono text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">link</span>
                        <span>/properti/{prop.id}</span>
                      </span>
                    </div>
                  </a>

                  {/* Card Content & Title Hyperlink */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <a
                        href={propertyHref}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectProperty(prop);
                        }}
                        className="text-[17px] font-bold text-[#0e1c2f] line-clamp-1 hover:text-[#0051d5] transition-colors block cursor-pointer"
                        title={prop.title}
                      >
                        {prop.title}
                      </a>
                      <p className="text-[13px] text-[#75777d] flex items-center gap-1 line-clamp-1">
                        <span className="material-symbols-outlined text-[15px] text-[#0051d5]">location_on</span>
                        {prop.location}
                      </p>

                      <div className="pt-2 grid grid-cols-3 gap-2 text-[12px] text-[#44474c] border-t border-[#eff4ff]">
                        <div>
                          <span className="text-[#75777d] block text-[10px] uppercase">Tanah</span>
                          <span className="font-semibold">{prop.landArea} m²</span>
                        </div>
                        <div>
                          <span className="text-[#75777d] block text-[10px] uppercase">Bangunan</span>
                          <span className="font-semibold">{prop.buildingArea} m²</span>
                        </div>
                        <div>
                          <span className="text-[#75777d] block text-[10px] uppercase">UWTO</span>
                          <span className="font-semibold text-[#0051d5]">s/d {prop.uwtoExpiryYear}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar with Hyperlinks */}
                    <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between">
                      <span className="text-[12px] text-[#75777d]">
                        Konsultan: <strong className="text-[#0e1c2f]">{prop.agentName}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCardLink(e, prop.id)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            copiedId === prop.id
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#0051d5] border-transparent'
                          }`}
                          title="Salin Link Halaman Listing"
                        >
                          {copiedId === prop.id ? '✓ Tersalin' : 'Salin Link'}
                        </button>

                        <a
                          href={propertyHref}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProperty(prop);
                          }}
                          className="bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Detail</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share Listing Modal */}
        <ShareListingModal
          property={shareModalProperty}
          isOpen={!!shareModalProperty}
          onClose={() => setShareModalProperty(null)}
        />

        {/* Empty State */}
        {!loading && filteredProperties.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e5eeff] p-8 space-y-3">
            <span className="material-symbols-outlined text-[#75777d] text-[48px]">search_off</span>
            <h3 className="text-[20px] font-bold text-[#0e1c2f]">Tidak ada properti yang cocok</h3>
            <p className="text-[14px] text-[#44474c] max-w-md mx-auto">
              Coba ubah kata kunci pencarian Anda atau reset kriteria filter untuk melihat seluruh portofolio kami di Batam.
            </p>
            <button
              onClick={() => {
                setSelectedDistrict('all');
                setSelectedCategory('all');
                setSelectedIntent('all');
                setSearchQuery('');
              }}
              className="mt-2 bg-[#0051d5] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-[#316bf3] transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
