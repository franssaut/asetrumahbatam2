import React, { useState } from 'react';
import { PageId, PropertyItem } from '../types';
import { PROPERTIES_LIST, AGENTS_LIST, BRAND_ASSETS } from '../data/mockData';
import { getPropertyPath, copyPropertyLinkToClipboard } from '../lib/navigation';
import { ShareListingModal } from '../components/ShareListingModal';

interface BerandaPageProps {
  properties?: PropertyItem[];
  onNavigate: (page: PageId) => void;
  onSelectProperty: (property: PropertyItem) => void;
}

export const BerandaPage: React.FC<BerandaPageProps> = ({ 
  properties: propsList,
  onNavigate, 
  onSelectProperty 
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState('Semua Kawasan');
  const [selectedCategory, setSelectedCategory] = useState('Semua Tipe');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareModalProperty, setShareModalProperty] = useState<PropertyItem | null>(null);

  const activeProperties = propsList && propsList.length > 0 ? propsList : PROPERTIES_LIST;
  const featuredProperties = activeProperties.slice(0, 4);

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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('katalog-properti');
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-[#0e1c2f] text-white py-20 md:py-28 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
            alt="Luxury Batam Real Estate Architecture"
            className="w-full h-full object-cover opacity-20 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c2f] via-[#0e1c2f]/85 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-center text-center">
          {/* Accreditation Tag */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 border border-white/15">
            <span className="material-symbols-outlined text-[#dbe1ff] text-[16px]">verified</span>
            <span className="text-[12px] font-bold text-[#dbe1ff] uppercase tracking-wider">
              Broker Properti Berlisensi AREBI & Terdaftar BP Batam
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-[36px] sm:text-[48px] lg:text-[60px] font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mb-6">
            Investasi Properti Mewah & Legalitas Terjamin di Batam
          </h1>

          <p className="text-[16px] md:text-[20px] text-[#bac7e1] max-w-2xl mb-10 leading-relaxed">
            Menghubungkan pembeli selektif dan pemilik unit residensial prestisius di Sukajadi, Batam Center, Nagoya, hingga waterfront villa Nongsa dengan kepastian audit UWTO 100% clean & clear.
          </p>

          {/* Integrated Search Box */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-4xl bg-white rounded-2xl p-3 md:p-4 shadow-2xl text-[#0b1c30] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border border-[#dbe1ff]"
          >
            {/* Field 1: Kawasan */}
            <div className="flex flex-col text-left px-3 py-1">
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider">
                Kawasan Batam
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-[14px] font-semibold text-[#0b1c30] focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="Semua Kawasan">Semua Kawasan</option>
                <option value="Sukajadi">Sukajadi / KDA</option>
                <option value="Batam Center">Batam Center</option>
                <option value="Nagoya / Lubuk Baja">Nagoya / Lubuk Baja</option>
                <option value="Nongsa">Nongsa Waterfront</option>
                <option value="Sekupang / Tiban">Tiban / Sekupang</option>
                <option value="Batu Aji / Marina">Batu Aji / Marina</option>
              </select>
            </div>

            {/* Field 2: Tipe Properti */}
            <div className="flex flex-col text-left px-3 py-1 border-t sm:border-t-0 sm:border-l border-[#eff4ff]">
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider">
                Tipe Properti
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[14px] font-semibold text-[#0b1c30] focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="Semua Tipe">Semua Tipe</option>
                <option value="Perumahan Residensial">Perumahan Residensial</option>
                <option value="Rumah Mewah">Rumah Mewah</option>
                <option value="Ruko Komersial">Ruko Komersial</option>
                <option value="Villa Waterfront">Villa Waterfront</option>
                <option value="Apartemen">Apartemen Penthouse</option>
                <option value="Gudang Industri">Gudang & Industri</option>
              </select>
            </div>

            {/* Field 3: Kata Kunci / Kompleks */}
            <div className="flex flex-col text-left px-3 py-1 border-t lg:border-t-0 lg:border-l border-[#eff4ff]">
              <label className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider">
                Nama Kompleks / Kata Kunci
              </label>
              <input
                type="text"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="Misal: Golf, Pool, Hook"
                className="bg-transparent text-[14px] font-medium text-[#0b1c30] placeholder:text-[#75777d] focus:outline-none mt-0.5"
              />
            </div>

            {/* Field 4: Action Button */}
            <div className="flex items-center">
              <button
                type="submit"
                className="w-full bg-[#0051d5] hover:bg-[#316bf3] text-white py-3.5 px-6 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Cari Properti</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Properties Showcase Section */}
      <section className="w-full py-16 md:py-24 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block mb-1">
                Portofolio Pilihan
              </span>
              <h2 className="text-[28px] md:text-[38px] font-extrabold text-[#0e1c2f] tracking-tight">
                Koleksi Properti Unggulan di Batam
              </h2>
              <p className="text-[15px] text-[#44474c] mt-1">
                Setiap unit telah melalui inspeksi fisik independen dan verifikasi keabsahan faktur UWTO BP Batam.
              </p>
            </div>

            <button
              onClick={() => onNavigate('katalog-properti')}
              className="inline-flex items-center gap-1.5 text-[#0051d5] hover:text-[#0e1c2f] font-bold text-[14px] transition-colors cursor-pointer self-start md:self-auto"
            >
              <span>Jelajahi Semua Listing</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((prop) => {
              const propertyHref = getPropertyPath(prop.id);

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#e5eeff] flex flex-col justify-between group"
                >
                  {/* Clickable Image Hyperlink */}
                  <a
                    href={propertyHref}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectProperty(prop);
                    }}
                    className="relative aspect-[16/11] overflow-hidden bg-slate-100 block cursor-pointer"
                    title={`Buka detail ${prop.title}`}
                  >
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#0e1c2f]/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {prop.category}
                    </div>

                    {/* Action Badges: Copy Link & Share */}
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
                        className="text-[16px] font-bold text-[#0e1c2f] line-clamp-1 hover:text-[#0051d5] transition-colors block cursor-pointer"
                        title={prop.title}
                      >
                        {prop.title}
                      </a>
                      <p className="text-[12px] text-[#75777d] flex items-center gap-1 line-clamp-1">
                        <span className="material-symbols-outlined text-[14px] text-[#0051d5]">location_on</span>
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
                    <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[12px]">
                      <span className="text-[#75777d]">Konsultan: <strong className="text-[#0e1c2f]">{prop.agentName}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCardLink(e, prop.id)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
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
                          className="text-[#0051d5] hover:text-[#0e1c2f] font-bold group-hover:translate-x-0.5 transition-all inline-flex items-center cursor-pointer"
                        >
                          Detail →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Share Modal for Featured Cards */}
          <ShareListingModal
            property={shareModalProperty}
            isOpen={!!shareModalProperty}
            onClose={() => setShareModalProperty(null)}
          />
        </div>
      </section>

      {/* Educational UWTO Trust Section */}
      <section className="w-full py-16 md:py-20 bg-white border-y border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5]">
                Karakteristik Yuridis Batam
              </span>
              <h2 className="text-[28px] md:text-[38px] font-extrabold text-[#0e1c2f] tracking-tight leading-tight">
                Mengapa Membeli Properti di Batam Butuh Broker Spesialis UWTO?
              </h2>
              <p className="text-[15px] text-[#44474c] leading-relaxed">
                Berbeda dari daerah lain di Indonesia, seluruh tanah di Pulau Batam berada di bawah kewenangan Hak Pengelolaan Lahan (HPL) BP Batam. Kepemilikan properti memerlukan pemahaman mendalam tentang siklus tarif sewa alokasi 30 tahun (UWTO).
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-[#eff4ff] p-4 rounded-xl border border-[#dbe1ff]">
                  <span className="material-symbols-outlined text-[#0051d5] text-[22px] mt-0.5">verified_user</span>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0e1c2f]">Verifikasi Riwayat Faktur LMS BP Batam</h4>
                    <p className="text-[12px] text-[#44474c] mt-0.5">
                      Memastikan pemilik lama telah melunasi seluruh cicilan UWTO dan tidak ada denda keterlambatan berjalan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#eff4ff] p-4 rounded-xl border border-[#dbe1ff]">
                  <span className="material-symbols-outlined text-[#0051d5] text-[22px] mt-0.5">description</span>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0e1c2f]">Kesesuaian Fatwa Planologi & IMB/PBG</h4>
                    <p className="text-[12px] text-[#44474c] mt-0.5">
                      Mencegah risiko pembongkaran atau pembatalan sertifikat akibat ketidaksesuaian peruntukan ruang zonasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('panduan-legalitas-uwto')}
                  className="inline-flex items-center gap-2 bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-6 py-3 rounded-full text-[14px] font-bold transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                  <span>Cek Kalkulator Simulasi Biaya UWTO</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#eff4ff] p-6 md:p-8 rounded-3xl border border-[#dbe1ff] space-y-6">
                <h3 className="text-[18px] font-bold text-[#0e1c2f]">
                  Perbandingan Transaksi Properti di Batam
                </h3>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl shadow-xs border border-[#e5eeff] space-y-2">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span>Transaksi Tanpa Pendampingan Spesialis</span>
                    </div>
                    <ul className="text-[12px] text-[#75777d] space-y-1.5 list-disc pl-5">
                      <li>Risiko tunggakan UWTO puluhan juta rupiah dibebankan ke pembeli baru.</li>
                      <li>Sertifikat tidak dapat dibalik nama karena sengketa batas alokasi PL.</li>
                      <li>Harga unit di-markup sepihak tanpa appraisal pembanding yang wajar.</li>
                    </ul>
                  </div>

                  <div className="bg-[#0e1c2f] text-white p-5 rounded-2xl shadow-md space-y-2">
                    <div className="flex items-center gap-2 text-[#dbe1ff] font-bold text-[13px]">
                      <span className="material-symbols-outlined text-[#0051d5] text-[18px] bg-white rounded-full p-0.5">
                        check
                      </span>
                      <span>Standar Aset Rumah Batam (AREBI Certified)</span>
                    </div>
                    <ul className="text-[12px] text-[#bac7e1] space-y-1.5 list-disc pl-5">
                      <li>Audit berkas 4 pilar (HGB, Faktur UWTO, Planologi, PBB-P2) tuntas sebelum listing.</li>
                      <li>Harga langsung dari pemilik pertama dengan transparansi notaris rekanan resmi.</li>
                      <li>Layanan asistensi pengurusan perpanjangan UWTO 30 tahun baru hingga selesai.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Strip Preview */}
      <section className="w-full py-16 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block mb-1">
                Konsultan Berdedikasi
              </span>
              <h2 className="text-[26px] md:text-[34px] font-extrabold text-[#0e1c2f]">
                Konsultan Properti Spesialis Kawasan
              </h2>
            </div>
            <button
              onClick={() => onNavigate('konsultasi-agen')}
              className="text-[#0051d5] hover:text-[#0e1c2f] text-[14px] font-bold flex items-center gap-1 cursor-pointer self-start md:self-auto"
            >
              <span>Lihat Semua Konsultan</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AGENTS_LIST.map((agent) => (
              <div
                key={agent.id}
                onClick={() => onNavigate('konsultasi-agen')}
                className="bg-white p-4 rounded-2xl border border-[#e5eeff] shadow-xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group"
              >
                <img
                  src={agent.photoUrl}
                  alt={agent.name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-[#0051d5]/20 group-hover:ring-[#0051d5] transition-all"
                />
                <div className="space-y-0.5">
                  <h4 className="text-[14px] font-bold text-[#0e1c2f] group-hover:text-[#0051d5] transition-colors">
                    {agent.name}
                  </h4>
                  <p className="text-[11px] text-[#0051d5] font-semibold">{agent.role.split('&')[0]}</p>
                  <p className="text-[11px] text-[#75777d]">{agent.districts}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fast CTA Banner */}
      <section className="w-full py-16 bg-[#0e1c2f] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-gradient-to-r from-[#0e1c2f] via-[#213145] to-[#0051d5]/40 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <h2 className="text-[26px] md:text-[32px] font-extrabold text-white">
                Ingin Menjual atau Menyewakan Properti Anda?
              </h2>
              <p className="text-[14px] text-[#bac7e1] leading-relaxed">
                Titipkan properti Anda bersama Aset Rumah Batam. Dapatkan analisis valuasi harga wajar dan promosi eksklusif ke basis investor aktif kami.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('titip-properti')}
                className="bg-[#0051d5] hover:bg-[#316bf3] text-white px-7 py-3.5 rounded-full text-[14px] font-bold transition-all shadow-md cursor-pointer text-center"
              >
                Titip Properti Sekarang
              </button>
              <a
                href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo, saya ingin konsultasi mengenai properti di Batam')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-full text-[14px] font-semibold transition-all border border-white/20 text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
