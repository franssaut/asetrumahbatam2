import React, { useState } from 'react';
import { PropertyItem, PageId } from '../types';
import { PROPERTIES_LIST, BRAND_ASSETS } from '../data/mockData';
import { 
  getPropertyPath, 
  getPropertyAbsoluteUrl, 
  getPropertyWhatsAppShareUrl, 
  copyPropertyLinkToClipboard,
  sharePropertyNative
} from '../lib/navigation';
import { ShareListingModal } from '../components/ShareListingModal';

interface DetailPropertiPageProps {
  property?: PropertyItem;
  onNavigate: (page: PageId) => void;
}

export const DetailPropertiPage: React.FC<DetailPropertiPageProps> = ({
  property: propProp,
  onNavigate,
}) => {
  const currentProperty = propProp || PROPERTIES_LIST[0];

  const [activeImage, setActiveImage] = useState<string>(currentProperty.imageUrl);
  const [dpPercent, setDpPercent] = useState<number>(20);
  const [tenorYears, setTenorYears] = useState<number>(15);
  const [interestRate, setInterestRate] = useState<number>(4.75);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Gallery items
  const allImages = [
    currentProperty.imageUrl,
    ...(currentProperty.additionalImages || []),
  ];

  // Direct page URLs
  const canonicalPath = getPropertyPath(currentProperty.id);
  const absoluteUrl = getPropertyAbsoluteUrl(currentProperty.id);
  const waShareUrl = getPropertyWhatsAppShareUrl(currentProperty);

  const handleCopyLink = async () => {
    const success = await copyPropertyLinkToClipboard(currentProperty.id);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    const shared = await sharePropertyNative(currentProperty);
    if (!shared) {
      setShareModalOpen(true);
    }
  };

  // KPR Calculator
  const propertyPrice = currentProperty.price;
  const downPayment = (propertyPrice * dpPercent) / 100;
  const loanPrincipal = propertyPrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const totalMonths = tenorYears * 12;
  const monthlyInstallment =
    monthlyRate > 0
      ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanPrincipal / totalMonths;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full flex flex-col bg-[#f8f9ff] py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        {/* Navigation Breadcrumb & Share Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-[#75777d]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('beranda')}
              className="hover:text-[#0e1c2f] transition-colors cursor-pointer"
            >
              Beranda
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate('katalog-properti')}
              className="hover:text-[#0e1c2f] transition-colors cursor-pointer"
            >
              Katalog Properti
            </button>
            <span>/</span>
            <span className="text-[#0e1c2f] font-semibold truncate max-w-[200px] sm:max-w-md">
              {currentProperty.title}
            </span>
          </div>

          {/* Quick Page Link Indicator & Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="hidden md:inline text-[11px] font-mono text-[#75777d] bg-white px-2.5 py-1 rounded-md border border-[#e5eeff]">
              {canonicalPath}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer shadow-2xs ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-[#eff4ff] text-[#0051d5] border border-[#dbe1ff]'
              }`}
              title="Salin tautan unik listing ini"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedLink ? 'check' : 'link'}
              </span>
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1c2f] hover:bg-[#0051d5] text-white text-[12px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span>Bagikan</span>
            </button>
          </div>
        </div>

        {/* Header Title & Price Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#e5eeff]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#0e1c2f] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                {currentProperty.category}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Audit UWTO Clear
              </span>
              <span className="bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold px-3 py-1 rounded-full">
                {currentProperty.legalStatus}
              </span>
            </div>
            <h1 className="text-[26px] md:text-[36px] font-extrabold text-[#0e1c2f] tracking-tight">
              {currentProperty.title}
            </h1>
            <p className="text-[14px] text-[#75777d] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5]">location_on</span>
              {currentProperty.location}, {currentProperty.district}, Batam
            </p>
          </div>

          <div className="text-left md:text-right shrink-0">
            <p className="text-[11px] uppercase tracking-wider text-[#75777d] font-semibold">
              Harga Penawaran
            </p>
            <p className="text-[28px] md:text-[34px] font-extrabold text-[#0051d5]">
              {currentProperty.priceFormatted}
              {currentProperty.period && <span className="text-[16px] text-[#44474c] font-medium">{currentProperty.period}</span>}
            </p>
          </div>
        </div>

        {/* Gallery Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-md">
            <img
              src={activeImage}
              alt={currentProperty.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          <div className="lg:col-span-3 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[16/10] lg:aspect-auto lg:h-28 rounded-xl overflow-hidden shrink-0 w-32 lg:w-full border-2 transition-all cursor-pointer ${
                  activeImage === img ? 'border-[#0051d5] shadow-md scale-[1.02]' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Main Content & Sticky Inquiry Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details, Legal Audit, Amenities, KPR Simulator */}
          <div className="lg:col-span-8 space-y-8">
            {/* Key Specs Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-[#e5eeff] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-[#eff4ff] rounded-xl text-center">
                <span className="material-symbols-outlined text-[#0051d5] text-[24px]">square_foot</span>
                <p className="text-[11px] text-[#75777d] uppercase font-bold mt-1">Luas Tanah</p>
                <p className="text-[16px] font-extrabold text-[#0e1c2f]">{currentProperty.landArea} m²</p>
              </div>
              <div className="p-3 bg-[#eff4ff] rounded-xl text-center">
                <span className="material-symbols-outlined text-[#0051d5] text-[24px]">home</span>
                <p className="text-[11px] text-[#75777d] uppercase font-bold mt-1">Luas Bangunan</p>
                <p className="text-[16px] font-extrabold text-[#0e1c2f]">{currentProperty.buildingArea} m²</p>
              </div>
              <div className="p-3 bg-[#eff4ff] rounded-xl text-center">
                <span className="material-symbols-outlined text-[#0051d5] text-[24px]">bed</span>
                <p className="text-[11px] text-[#75777d] uppercase font-bold mt-1">Kamar Tidur</p>
                <p className="text-[16px] font-extrabold text-[#0e1c2f]">{currentProperty.bedrooms ?? '-'}</p>
              </div>
              <div className="p-3 bg-[#eff4ff] rounded-xl text-center">
                <span className="material-symbols-outlined text-[#0051d5] text-[24px]">bathtub</span>
                <p className="text-[11px] text-[#75777d] uppercase font-bold mt-1">Kamar Mandi</p>
                <p className="text-[16px] font-extrabold text-[#0e1c2f]">{currentProperty.bathrooms ?? '-'}</p>
              </div>
            </div>

            {/* Description & Overview */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#e5eeff] shadow-xs space-y-4">
              <h3 className="text-[20px] font-bold text-[#0e1c2f]">Deskripsi Properti</h3>
              <p className="text-[15px] text-[#44474c] leading-relaxed">
                {currentProperty.description}
              </p>
            </div>

            {/* Legal Audit & UWTO Card */}
            <div className="bg-gradient-to-br from-[#0e1c2f] to-[#1a2e47] text-white p-6 md:p-8 rounded-2xl shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#3ecf8e]">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold">Verifikasi Legalitas & BP Batam</h3>
                    <p className="text-[12px] text-white/70">Audit Faktur UWTO & Validasi BPN Bersih</p>
                  </div>
                </div>
                <span className="bg-[#3ecf8e]/20 text-[#3ecf8e] text-[11px] font-bold px-3 py-1 rounded-full uppercase border border-[#3ecf8e]/30">
                  Clean & Clear
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                    Status Sertifikat
                  </p>
                  <p className="text-[15px] font-bold text-white mt-1">
                    {currentProperty.legalStatus}
                  </p>
                  <p className="text-[11px] text-white/60 mt-1">Peralihan hak via Notaris / PPAT</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                    Masa Berlaku UWTO
                  </p>
                  <p className="text-[15px] font-bold text-[#3ecf8e] mt-1">
                    Hingga Tahun {currentProperty.uwtoExpiryYear}
                  </p>
                  <p className="text-[11px] text-white/60 mt-1">{currentProperty.uwtoStatus}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                    Zonasi & Tata Ruang
                  </p>
                  <p className="text-[15px] font-bold text-white mt-1">
                    Sesuai Fatwa Planologi
                  </p>
                  <p className="text-[11px] text-white/60 mt-1">BP Batam & Pemko Bebas Sengketa</p>
                </div>
              </div>
            </div>

            {/* Facilities & Amenities */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#e5eeff] shadow-xs space-y-4">
              <h3 className="text-[20px] font-bold text-[#0e1c2f]">Fasilitas & Keunggulan Spesifikasi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentProperty.facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[13px] text-[#44474c]">
                    <span className="material-symbols-outlined text-[#0051d5] text-[18px]">check_circle</span>
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive KPR Calculator */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#e5eeff] shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#eff4ff] pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
                    Simulasi Pembiayaan Bank
                  </span>
                  <h3 className="text-[20px] font-bold text-[#0e1c2f]">Kalkulator KPR Properti</h3>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#75777d]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Mitra: BCA, Mandiri, BNI, OCBC
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* DP */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#75777d] uppercase">
                    Uang Muka (DP: {dpPercent}%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={dpPercent}
                    onChange={(e) => setDpPercent(Number(e.target.value))}
                    className="w-full accent-[#0051d5] cursor-pointer"
                  />
                  <p className="text-[13px] font-bold text-[#0e1c2f]">{formatRupiah(downPayment)}</p>
                </div>

                {/* Tenor */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#75777d] uppercase">
                    Tenor ({tenorYears} Tahun)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    value={tenorYears}
                    onChange={(e) => setTenorYears(Number(e.target.value))}
                    className="w-full accent-[#0051d5] cursor-pointer"
                  />
                  <p className="text-[13px] font-bold text-[#0e1c2f]">{tenorYears * 12} Bulan Cicilan</p>
                </div>

                {/* Interest Rate */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#75777d] uppercase">
                    Suku Bunga KPR (% p.a)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full bg-[#eff4ff] rounded-xl px-3 py-2 text-[13px] font-bold text-[#0e1c2f] focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[13px] text-[#75777d]">%</span>
                  </div>
                  <p className="text-[11px] text-[#75777d]">Bunga fixed 3-5 tahun pertama</p>
                </div>
              </div>

              {/* Installment Result Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#eff4ff] to-[#f4f7ff] border border-[#dbe1ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase font-bold text-[#75777d]">
                    Estimasi Angsuran Bulanan
                  </p>
                  <p className="text-[26px] md:text-[32px] font-extrabold text-[#0051d5]">
                    {formatRupiah(monthlyInstallment)}
                    <span className="text-[14px] text-[#44474c] font-normal"> / bulan</span>
                  </p>
                  <p className="text-[11px] text-[#75777d]">Pokok Pinjaman: {formatRupiah(loanPrincipal)}</p>
                </div>

                <a
                  href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(`Halo saya ingin konsultasi simulasi KPR untuk unit ${currentProperty.title} (${canonicalPath}) dengan DP ${dpPercent}% dan tenor ${tenorYears} tahun`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Ajukan KPR via Konsultan</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Assigned Agent Card & Action Widget */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            {/* Direct Page Link Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
                  Link Halaman Listing
                </span>
                <span className="text-[10px] bg-blue-50 text-[#0051d5] px-2 py-0.5 rounded-md font-mono">
                  ID: {currentProperty.id}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#eff4ff] p-1.5 rounded-xl border border-[#dbe1ff]">
                <input
                  type="text"
                  readOnly
                  value={absoluteUrl}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-transparent px-2 text-[12px] font-mono text-[#0e1c2f] focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0051d5] hover:bg-[#316bf3] text-white'
                  }`}
                  title="Salin link langsung ke clipboard"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedLink ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white py-2 px-3 rounded-xl text-[12px] font-bold transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Kirim WA</span>
                </a>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-1.5 bg-[#0e1c2f] hover:bg-[#0051d5] text-white py-2 px-3 rounded-xl text-[12px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  <span>Bagikan</span>
                </button>
              </div>
            </div>

            {/* Agent Contact Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#e5eeff] shadow-sm space-y-5">
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
                Konsultan Bertanggung Jawab
              </span>

              <div className="flex items-center gap-4">
                <img
                  src={BRAND_ASSETS.userAvatar}
                  alt={currentProperty.agentName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#0051d5]/20 shadow-xs"
                />
                <div>
                  <h4 className="text-[17px] font-bold text-[#0e1c2f]">{currentProperty.agentName}</h4>
                  <p className="text-[12px] text-[#0051d5] font-semibold">{currentProperty.agentRole}</p>
                  <p className="text-[12px] text-[#75777d] mt-0.5">Spesialis Kawasan {currentProperty.district}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(`Halo ${currentProperty.agentName}, saya tertarik dan ingin survei unit ${currentProperty.title} (${absoluteUrl})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0051d5] hover:bg-[#316bf3] text-white py-3.5 px-4 rounded-xl text-[14px] font-bold transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Jadwalkan Survei ke WhatsApp</span>
                </a>

                <a
                  href={`tel:${BRAND_ASSETS.phoneRaw}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0e1c2f] py-3 px-4 rounded-xl text-[13px] font-bold transition-all border border-[#dbe1ff]"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#0051d5]">call</span>
                  <span>Telepon Konsultan</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#eff4ff] text-[12px] text-[#75777d] space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <span className="material-symbols-outlined text-[16px]">security</span>
                  <span>Jaminan tanpa markup harga dari pemilik</span>
                </div>
                <div className="flex items-center gap-2 text-[#44474c]">
                  <span className="material-symbols-outlined text-[16px]">directions_car</span>
                  <span>Antar-jemput survei lokasi privat gratis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareListingModal
        property={currentProperty}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
