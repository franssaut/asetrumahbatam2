import React, { useState } from 'react';
import { BRAND_ASSETS } from '../data/mockData';
import { submitPropertyListing } from '../lib/supabase';

export const TitipPropertiPage: React.FC = () => {
  const [intent, setIntent] = useState<'jual' | 'sewa'>('jual');
  const [propertyType, setPropertyType] = useState<string>('Rumah Mewah');
  const [ownerName, setOwnerName] = useState('');
  const [ownerWa, setOwnerWa] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('');
  const [lt, setLt] = useState('');
  const [lb, setLb] = useState('');
  const [legalStatus, setLegalStatus] = useState('');
  const [uwtoDuration, setUwtoDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const propertyTypes = [
    { id: 'Rumah Mewah', label: 'Rumah Mewah', icon: 'villa' },
    { id: 'Ruko Komersial', label: 'Ruko Komersial', icon: 'storefront' },
    { id: 'Tanah Kavling', label: 'Tanah Kavling', icon: 'landscape' },
    { id: 'Apartemen', label: 'Apartemen', icon: 'apartment' },
    { id: 'Gudang Industri', label: 'Gudang Industri', icon: 'warehouse' },
  ];

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format numeric input with dot separators
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setPrice('');
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID').format(Number(rawVal));
    setPrice(formatted);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const names = Array.from(e.dataTransfer.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...names].slice(0, 8));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setUploadedFiles((prev) => [...prev, ...names].slice(0, 8));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save to Supabase (with automatic offline fallback)
    await submitPropertyListing({
      ownerName,
      ownerWhatsapp: ownerWa,
      propertyType,
      region,
      address,
      price: price || '2.500.000.000',
      landArea: Number(lt) || 0,
      buildingArea: Number(lb) || 0,
      legalStatus,
      uwtoDuration,
      notes,
      intent,
    });

    const formattedMessage =
      `*PENGAJUAN TITIP PROPERTI (${intent.toUpperCase()})*\n\n` +
      `*Kategori:* ${propertyType}\n` +
      `*Nama Pemilik:* ${ownerName}\n` +
      `*WhatsApp:* +62 ${ownerWa}\n` +
      `*Wilayah Batam:* ${region}\n` +
      `*Alamat/Kompleks:* ${address}\n` +
      `*Estimasi Harga:* Rp ${price || '2.500.000.000'}\n` +
      `*Luas:* LT ${lt}m² / LB ${lb || '-'}m²\n` +
      `*Status Sertifikat:* ${legalStatus}\n` +
      `*Kondisi UWTO:* ${uwtoDuration}\n` +
      `*Catatan Fasilitas:* ${notes || 'Tidak ada catatan'}\n` +
      `*Jumlah Foto Disiapkan:* ${uploadedFiles.length} file\n\n` +
      `Mohon segera ditindaklanjuti untuk appraisal & verifikasi listing.`;

    // Open WhatsApp
    const waUrl = `https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(formattedMessage)}`;
    window.open(waUrl, '_blank');

    setIsSubmitted(true);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full bg-white py-14 md:py-16 border-b border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0051d5] animate-pulse"></span>
              Layanan Titip Jual & Sewa Resmi
            </div>

            <h1 className="text-[32px] md:text-[46px] lg:text-[54px] font-extrabold text-[#0b1c30] tracking-tight leading-tight">
              Titipkan Properti Anda, Jangkau Pembeli & Penyewa Tepat di Batam
            </h1>

            <p className="text-[15px] md:text-[18px] text-[#44474c] max-w-3xl leading-relaxed">
              Bantu pasarkan rumah, ruko, tanah kavling, villa, dan apartemen Anda dengan pendampingan legalitas UWTO, valuasi harga pasar akurat, dan jaringan pembeli terverifikasi.
            </p>

            {/* Trust Badges Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold border border-[#dbe1ff]">
                <span className="material-symbols-outlined text-[18px] text-[#0051d5]">verified</span>
                <span>Verifikasi Legalitas 100%</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold border border-[#dbe1ff]">
                <span className="material-symbols-outlined text-[18px] text-[#0051d5]">campaign</span>
                <span>Publikasi Multi-Channel Premium</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eff4ff] text-[#0b1c30] text-[12px] font-semibold border border-[#dbe1ff]">
                <span className="material-symbols-outlined text-[18px] text-[#0051d5]">shield_person</span>
                <span>Didampingi Broker Berlisensi AREBI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Listing Form Section */}
      <section className="w-full bg-[#f8f9ff] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] p-6 md:p-10">
            {/* Header & Segmented Intent Switcher */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#eff4ff]">
              <div>
                <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block mb-1">
                  Formulir Resmi
                </span>
                <h2 className="text-[22px] md:text-[28px] font-bold text-[#0b1c30]">Data Unit Properti</h2>
                <p className="text-[13px] text-[#44474c]">
                  Lengkapi detail unit Anda untuk estimasi valuasi dan verifikasi kelayakan awal.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="inline-flex bg-[#eff4ff] p-1.5 rounded-full self-start md:self-auto border border-[#dbe1ff]">
                <button
                  type="button"
                  onClick={() => setIntent('jual')}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                    intent === 'jual'
                      ? 'bg-[#0e1c2f] text-white shadow-xs'
                      : 'text-[#44474c] hover:text-[#0b1c30]'
                  }`}
                >
                  Ingin Jual Properti
                </button>
                <button
                  type="button"
                  onClick={() => setIntent('sewa')}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                    intent === 'sewa'
                      ? 'bg-[#0e1c2f] text-white shadow-xs'
                      : 'text-[#44474c] hover:text-[#0b1c30]'
                  }`}
                >
                  Ingin Sewa Properti
                </button>
              </div>
            </div>

            {/* Submission Confirmation Alert */}
            {isSubmitted && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">task_alt</span>
                <div>
                  <h4 className="font-bold text-[15px]">Data Formulir Berhasil Disiapkan & Dibuka ke WhatsApp</h4>
                  <p className="text-[13px] text-emerald-800 mt-0.5">
                    Konsultan listing kami akan meninjau data unit, memeriksa riwayat UWTO di LMS BP Batam, serta mengonfirmasi jadwal survei fisik.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* Property Type Chips Selector */}
              <div className="space-y-2">
                <label className="block text-[14px] font-bold text-[#0b1c30]">
                  Tipe Kategori Properti
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
                  {propertyTypes.map((t) => {
                    const isSelected = propertyType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPropertyType(t.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0e1c2f] text-white border-[#0e1c2f] shadow-xs'
                            : 'bg-[#eff4ff] text-[#44474c] border-transparent hover:border-[#0051d5]/40 hover:text-[#0b1c30]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px] mb-1">
                          {t.icon}
                        </span>
                        <span className="text-[12px] font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    Nama Lengkap Pemilik / Kuasa
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#44474c] text-[20px]">
                      person
                    </span>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Contoh: Hendra Wijaya"
                      className="w-full bg-[#eff4ff] rounded-xl pl-11 pr-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    Nomor WhatsApp Aktif
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1 text-[#44474c] text-[13px] font-bold">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      <span>+62</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={ownerWa}
                      onChange={(e) => setOwnerWa(e.target.value)}
                      placeholder="823-9105-9216"
                      className="w-full bg-[#eff4ff] rounded-xl pl-20 pr-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Location and Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    Kawasan di Batam
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[#0b1c30] text-[14px] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all cursor-pointer"
                    >
                      <option value="" disabled>Pilih Wilayah</option>
                      <option value="Batam Center">Batam Center</option>
                      <option value="Sukajadi">Sukajadi / KDA</option>
                      <option value="Nagoya / Lubuk Baja">Nagoya / Lubuk Baja</option>
                      <option value="Bengkong">Bengkong</option>
                      <option value="Nongsa">Nongsa</option>
                      <option value="Batu Aji">Batu Aji / Marina</option>
                      <option value="Tiban / Sekupang">Tiban / Sekupang</option>
                      <option value="Sei Panas / Baloi">Sei Panas / Baloi</option>
                      <option value="Kabil / Punggur">Kabil / Punggur</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#44474c] text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    Nama Kompleks, Jalan, & Blok Unit
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#44474c] text-[20px]">
                      home_pin
                    </span>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Misal: Perumahan Sukajadi Royal Bay, Blok C2 No. 8"
                      className="w-full bg-[#eff4ff] rounded-xl pl-11 pr-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Valuation & Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">
                    {intent === 'jual' ? 'Perkiraan Harga Jual (Rp)' : 'Perkiraan Harga Sewa / Thn (Rp)'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[#44474c] text-[13px] font-bold">Rp</span>
                    <input
                      type="text"
                      required
                      value={price}
                      onChange={handlePriceChange}
                      placeholder={intent === 'jual' ? '2.500.000.000' : '75.000.000'}
                      className="w-full bg-[#eff4ff] rounded-xl pl-11 pr-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#0b1c30]">Luas Tanah (LT)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        required
                        value={lt}
                        onChange={(e) => setLt(e.target.value)}
                        placeholder="200"
                        className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all"
                      />
                      <span className="absolute right-3.5 text-[#44474c] text-[12px] font-medium">m²</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-[#0b1c30]">Luas Bangunan (LB)</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={lb}
                        onChange={(e) => setLb(e.target.value)}
                        placeholder="180"
                        className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all"
                      />
                      <span className="absolute right-3.5 text-[#44474c] text-[12px] font-medium">m²</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legalitas Batam (UWTO & Sertifikat) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Status Legalitas Dokumen</label>
                  <div className="relative">
                    <select
                      required
                      value={legalStatus}
                      onChange={(e) => setLegalStatus(e.target.value)}
                      className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[#0b1c30] text-[14px] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all cursor-pointer"
                    >
                      <option value="" disabled>Pilih Status Sertifikat</option>
                      <option value="Sertifikat Hak Milik (SHM)">Sertifikat Hak Milik (SHM)</option>
                      <option value="Sertifikat HGB Murni (BPN)">Sertifikat HGB Murni (BPN)</option>
                      <option value="Alokasi / PL BP Batam (Lengkap SKEP, SPJ)">Alokasi / PL BP Batam (Lengkap SKEP, SPJ)</option>
                      <option value="Strata Title / Unit Kondominium">Strata Title / Unit Kondominium</option>
                      <option value="Dalam Proses Peningkatan Sertifikat">Dalam Proses Peningkatan Sertifikat</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#44474c] text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Masa Berlaku UWTO BP Batam</label>
                  <div className="relative">
                    <select
                      required
                      value={uwtoDuration}
                      onChange={(e) => setUwtoDuration(e.target.value)}
                      className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[#0b1c30] text-[14px] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all cursor-pointer"
                    >
                      <option value="" disabled>Pilih Rentang UWTO</option>
                      <option value="Masih Panjang (> 15 Tahun)">Masih Panjang (&gt; 15 Tahun)</option>
                      <option value="Sedang (7 - 15 Tahun)">Sedang (7 - 15 Tahun)</option>
                      <option value="Mendekati Jatuh Tempo (< 5 Tahun)">Mendekati Jatuh Tempo (&lt; 5 Tahun)</option>
                      <option value="Sudah Diperpanjang 30 Tahun Baru">Sudah Diperpanjang 30 Tahun Baru</option>
                      <option value="Perlu Dibantu Pengurusan Perpanjangan">Perlu Dibantu Pengurusan Perpanjangan</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#44474c] text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#0b1c30]">
                  Unggah Foto Unit Properti (Opsional)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="bg-[#eff4ff] border-2 border-dashed border-[#c5c6cd] hover:border-[#0051d5] rounded-2xl p-6 text-center cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    id="property-file-input"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="property-file-input" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0051d5] mx-auto shadow-xs mb-2">
                      <span className="material-symbols-outlined text-[26px]">add_photo_alternate</span>
                    </div>
                    <div className="text-[14px] font-bold text-[#0b1c30]">
                      Klik untuk pilih berkas foto atau seret ke area ini
                    </div>
                    <p className="text-[12px] text-[#44474c] mt-0.5">
                      Format JPG, PNG, atau HEIC (Maksimal 10 foto, maks. 10MB per foto)
                    </p>
                  </label>

                  {/* Uploaded File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center pt-4">
                      {uploadedFiles.map((fileName, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-white border border-[#dbe1ff] px-3 py-1 rounded-full text-[12px] font-medium text-[#0b1c30] shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#0051d5]">image</span>
                          <span className="max-w-[140px] truncate">{fileName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="text-[#75777d] hover:text-rose-600 ml-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-[#0b1c30]">
                  Catatan Tambahan & Fasilitas Pendukung
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sebutkan fasilitas unit (furnished/unfurnished, daya listrik, hadap arah mata angin, renovasi baru, akses jalan, dsb)..."
                  className="w-full bg-[#eff4ff] rounded-xl p-4 text-[#0b1c30] text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent transition-all resize-y"
                />
              </div>

              {/* Submission Button & Security Assurance */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="w-full bg-[#0e1c2f] hover:bg-[#0051d5] text-white py-4 px-6 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  <span>Kirim Data Titip Properti</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[#44474c] text-center text-[12px]">
                  <span className="material-symbols-outlined text-[16px] text-[#0051d5]">lock</span>
                  <p>
                    Data Anda terjamin kerahasiaannya dan hanya digunakan untuk verifikasi listing internal tim kami.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Key Advantages Grid Section */}
      <section className="w-full bg-white py-14 md:py-20 border-y border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block mb-1">
              Keunggulan Layanan
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0b1c30] leading-tight">
              Kenapa Memilih Titip Properti di Aset Rumah Batam?
            </h2>
            <p className="text-[15px] text-[#44474c] mt-2 leading-relaxed">
              Kami mengombinasikan kekuatan data lokal, keabsahan hukum, dan jangkauan pasar luas untuk memastikan aset properti Anda dipasarkan dengan standar tertinggi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#f8f9ff] p-6 md:p-8 rounded-2xl border border-[#e5eeff] space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#dce9ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[28px]">query_stats</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30]">Valuasi Harga Pasar yang Presisi</h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Analisis tren transaksi nyata dan komparasi nilai di kawasan Batam agar unit Anda cepat terserap pasar tanpa risiko menjual di bawah nilai wajar.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[#0051d5] text-[13px] font-semibold border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[18px]">insights</span>
                <span>Berdasarkan Data Transaksi Terkini</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#f8f9ff] p-6 md:p-8 rounded-2xl border border-[#e5eeff] space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#dce9ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[28px]">policy</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30]">Pemeriksaan Legalitas & UWTO Aman</h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Membantu pengecekan kesesuaian fatwa planologi, verifikasi jatuh tempo perpanjangan UWTO BP Batam, serta validasi status sertifikat di BPN Batam.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[#0051d5] text-[13px] font-semibold border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Perlindungan Hukum Dua Arah</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#f8f9ff] p-6 md:p-8 rounded-2xl border border-[#e5eeff] space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#dce9ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[28px]">hub</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30]">Jaringan Pembeli & Investor Siap Beli</h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Akses langsung ke basis data investor aktif dan calon penyewa profesional dari Batam, Jakarta, hingga ekspatriat Singapura dan Malaysia.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[#0051d5] text-[13px] font-semibold border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span>2.500+ Basis Investor Terdaftar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Step Process Section */}
      <section className="w-full bg-[#f8f9ff] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
              Alur Transaksi
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0b1c30]">
              4 Langkah Mudah Proses Titip Properti
            </h2>
            <p className="text-[15px] text-[#44474c]">
              Dari pengisian data awal hingga penandatanganan akta di hadapan Notaris, kami mengawal setiap tahap secara profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5eeff] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-extrabold text-[#0051d5]">01</span>
                <div className="w-9 h-9 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#0e1c2f]">
                  <span className="material-symbols-outlined text-[20px]">edit_document</span>
                </div>
              </div>
              <h3 className="text-[17px] font-bold text-[#0b1c30] pt-1">Kirim Detail Unit</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Isi formulir online di atas atau hubungi konsultan kami secara langsung untuk mendaftarkan spesifikasi awal properti Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5eeff] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-extrabold text-[#0051d5]">02</span>
                <div className="w-9 h-9 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#0e1c2f]">
                  <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                </div>
              </div>
              <h3 className="text-[17px] font-bold text-[#0b1c30] pt-1">Survei & Penaksiran</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Tim profesional kami menjadwalkan inspeksi fisik ke lokasi unit dan memverifikasi kelengkapan dokumen kepemilikan.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5eeff] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-extrabold text-[#0051d5]">03</span>
                <div className="w-9 h-9 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#0e1c2f]">
                  <span className="material-symbols-outlined text-[20px]">share_reviews</span>
                </div>
              </div>
              <h3 className="text-[17px] font-bold text-[#0b1c30] pt-1">Pemasaran Tertarget</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Listing diterbitkan secara eksklusif ke jaringan broker, portal multi-channel, dan ditawarkan langsung ke calon prospek relevan.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5eeff] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[28px] font-extrabold text-[#0051d5]">04</span>
                <div className="w-9 h-9 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#0e1c2f]">
                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                </div>
              </div>
              <h3 className="text-[17px] font-bold text-[#0b1c30] pt-1">Transaksi & Serah Terima</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Pendampingan negosiasi terbaik hingga pengikatan Perjanjian Pengikatan Jual Beli (PPJB) / AJB di Notaris/PPAT terpercaya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fast-Contact WhatsApp Callout Banner */}
      <section className="w-full bg-[#eff4ff] py-14 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-[#0e1c2f] text-white rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#dbe1ff] text-[11px] font-bold uppercase">
                <span className="material-symbols-outlined text-[14px]">support_agent</span>
                <span>Respon Cepat Prioritas</span>
              </div>
              <h2 className="text-[22px] md:text-[28px] font-bold text-white">
                Ingin Konsultasi Cepat Sebelum Menitipkan Properti?
              </h2>
              <p className="text-[14px] text-[#77849c] leading-relaxed">
                Hubungi tim konsultan listing kami langsung melalui WhatsApp untuk konsultasi valuasi, estimasi biaya UWTO, dan respon instan tanpa antre.
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <a
                href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo Aset Rumah Batam, saya ingin konsultasi titip properti')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0051d5] text-white hover:bg-[#316bf3] px-6 py-4 rounded-full text-[14px] font-bold transition-all shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>Chat WhatsApp Konsultan Listing ({BRAND_ASSETS.phone})</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
