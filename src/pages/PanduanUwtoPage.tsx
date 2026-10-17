import React, { useState } from 'react';
import { UWTO_TARIFF_DATA, BRAND_ASSETS } from '../data/mockData';

export const PanduanUwtoPage: React.FC = () => {
  const [landArea, setLandArea] = useState<number>(200);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(0);
  const [durationYears, setDurationYears] = useState<number>(30);

  const selectedZone = UWTO_TARIFF_DATA[selectedZoneIndex];
  // Calculate estimated UWTO cost
  // Standard 30 year rate is ratePerSqm30Years
  const ratePerYearPerSqm = selectedZone.ratePerSqm30Years / 30;
  const totalUwtoCost = landArea * ratePerYearPerSqm * durationYears;
  const adminLmsFee = 2500000; // LMS administrative processing fee estimate

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full flex flex-col bg-[#f8f9ff]">
      {/* Hero Banner */}
      <section className="bg-[#0e1c2f] text-white py-16 md:py-20 border-b border-[#213145]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-[#dbe1ff] text-[11px] font-bold uppercase tracking-wider mx-auto">
            <span className="material-symbols-outlined text-[15px]">menu_book</span>
            <span>Panduan Agraria Khusus Batam</span>
          </div>

          <h1 className="text-[32px] md:text-[46px] font-extrabold text-white tracking-tight leading-tight">
            Panduan Lengkap Legalitas & UWTO BP Batam
          </h1>

          <p className="text-[16px] text-[#bac7e1] leading-relaxed">
            Pahami hak atas tanah di Pulau Batam, alur perpanjangan Uang Wajib Tahunan Otorita (UWTO), serta kepemilikan bagi Warga Negara Asing (WNA).
          </p>
        </div>
      </section>

      {/* Interactive UWTO BP Batam Calculator */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#e5eeff] space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#eff4ff]">
              <div>
                <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block mb-1">
                  Simulasi Biaya Resmi
                </span>
                <h2 className="text-[24px] md:text-[30px] font-bold text-[#0e1c2f]">
                  Kalkulator Estimasi Biaya Perpanjangan UWTO
                </h2>
                <p className="text-[14px] text-[#44474c] mt-1">
                  Hitung perkiraan tagihan faktur UWTO BP Batam berdasarkan zonasi tarif Perka BP Batam terbaru.
                </p>
              </div>

              <div className="bg-[#eff4ff] px-3.5 py-1.5 rounded-full text-[#0051d5] text-[12px] font-bold self-start md:self-auto flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Standar BP Batam LMS</span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Land Area */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#0e1c2f]">Luas Tanah (LT in m²)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="50000"
                    value={landArea}
                    onChange={(e) => setLandArea(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[15px] font-bold text-[#0e1c2f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                  <span className="absolute right-4 top-3 text-[13px] text-[#75777d] font-bold">m²</span>
                </div>
                <p className="text-[11px] text-[#75777d]">Contoh: 180m², 200m², 360m²</p>
              </div>

              {/* Zonasi Kawasan */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#0e1c2f]">Kawasan & Peruntukan Zonasi</label>
                <div className="relative">
                  <select
                    value={selectedZoneIndex}
                    onChange={(e) => setSelectedZoneIndex(Number(e.target.value))}
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[13px] font-semibold text-[#0e1c2f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] appearance-none cursor-pointer"
                  >
                    {UWTO_TARIFF_DATA.map((z, idx) => (
                      <option key={idx} value={idx}>
                        {z.zone}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#44474c] text-[20px]">
                    expand_more
                  </span>
                </div>
                <p className="text-[11px] text-[#75777d] truncate">{selectedZone.desc}</p>
              </div>

              {/* Durasi Perpanjangan */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#0e1c2f]">Jangka Waktu Perpanjangan</label>
                <div className="relative">
                  <select
                    value={durationYears}
                    onChange={(e) => setDurationYears(Number(e.target.value))}
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[14px] font-semibold text-[#0e1c2f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] appearance-none cursor-pointer"
                  >
                    <option value={30}>30 Tahun Penuh (Rekomendasi Utama)</option>
                    <option value={20}>20 Tahun</option>
                    <option value={10}>10 Tahun</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#44474c] text-[20px]">
                    expand_more
                  </span>
                </div>
                <p className="text-[11px] text-[#75777d]">Masa alokasi resmi BP Batam</p>
              </div>
            </div>

            {/* Cost Breakdown Card */}
            <div className="bg-[#0e1c2f] text-white p-6 md:p-8 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[12px] text-[#dbe1ff] uppercase tracking-wider font-semibold">
                    Estimasi Total Biaya Pokok UWTO
                  </p>
                  <p className="text-[28px] md:text-[36px] font-extrabold text-white">
                    {formatRupiah(totalUwtoCost)}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[12px] text-[#bac7e1]">
                  <p>Tarif per m²: {formatRupiah(selectedZone.ratePerSqm30Years * (durationYears / 30))}</p>
                  <p>Estimasi Administrasi LMS: {formatRupiah(adminLmsFee)}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[12px] text-[#bac7e1]">
                  Butuh pendampingan pengajuan perpanjangan UWTO ke kantor Badan Pengusahaan Batam?
                </p>
                <a
                  href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(`Halo Aset Rumah Batam, saya ingin konsultasi pengurusan perpanjangan UWTO untuk luas tanah ${landArea}m² di kawasan ${selectedZone.zone}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0051d5] hover:bg-[#316bf3] text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shrink-0 cursor-pointer"
                >
                  Bantu Urus Perpanjangan UWTO
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Legal Documents in Batam */}
      <section className="py-12 md:py-16 bg-white border-y border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
              Standar Due Diligence
            </span>
            <h2 className="text-[26px] md:text-[36px] font-extrabold text-[#0e1c2f]">
              4 Pilar Dokumen Wajib Sebelum Transaksi di Batam
            </h2>
            <p className="text-[14px] text-[#44474c]">
              Jangan menandatangani Akta Jual Beli (AJB) atau membayar uang muka sebelum memeriksa 4 berkas berikut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#f8f9ff] p-6 rounded-2xl border border-[#e5eeff] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dce9ff] text-[#0051d5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">contract</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0e1c2f]">1. Sertifikat HGB / Hak Pakai</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Diterbitkan oleh BPN Kota Batam. Pastikan nama sertifikat identik dengan KTP penjual dan tidak sedang dalam pembebanan hak tanggungan sita.
              </p>
            </div>

            <div className="bg-[#f8f9ff] p-6 rounded-2xl border border-[#e5eeff] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dce9ff] text-[#0051d5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">receipt_long</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0e1c2f]">2. Faktur & SK UWTO BP Batam</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Bukti bayar tarif sewa lahan 30 tahun. Menunjukkan batas tanggal jatuh tempo perpanjangan dan konfirmasi tidak ada denda berjalan.
              </p>
            </div>

            <div className="bg-[#f8f9ff] p-6 rounded-2xl border border-[#e5eeff] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dce9ff] text-[#0051d5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">architecture</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0e1c2f]">3. Fatwa Planologi / IMB / PBG</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Ketetapan resmi tata ruang zonasi dari Direktorat Lahan BP Batam dan Pemko Batam mengenai batas sempadan bangunan dan ketinggian unit.
              </p>
            </div>

            <div className="bg-[#f8f9ff] p-6 rounded-2xl border border-[#e5eeff] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dce9ff] text-[#0051d5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">paid</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#0e1c2f]">4. Bukti Lunas PBB-P2 Batam</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Validasi lunas Pajak Bumi dan Bangunan dari Bapenda Kota Batam sebagai syarat mutlak validasi BPHTB dan PPh di kantor notaris.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide for WNA / Foreigners */}
      <section className="py-12 md:py-16 bg-[#eff4ff]">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#dbe1ff] space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold uppercase">
              <span className="material-symbols-outlined text-[15px]">public</span>
              <span>Regulasi WNA (PP 18/2021)</span>
            </div>

            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0e1c2f]">
              Panduan Pembelian Properti bagi Warga Negara Asing (WNA) di Batam
            </h2>

            <div className="space-y-3 text-[14px] text-[#44474c] leading-relaxed">
              <p>
                Berdasarkan <strong>Peraturan Pemerintah (PP) Nomor 18 Tahun 2021</strong> dan <strong>Permen ATR/BPN No. 18 Tahun 2021</strong>, WNA dapat memiliki rumah tinggal atau hunian di Batam dengan persyaratan yang jauh lebih fleksibel:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Dokumen Cukup Paspor / Visa Kunjungan:</strong> Tidak wajib memiliki KITAS/KITAP bagi pemilikan satuan rumah susun/apartemen berstatus Hak Pakai.
                </li>
                <li>
                  <strong>Batas Harga Minimum yang Menarik:</strong> Batam menetapkan ambang batas harga hunian yang sangat kompetitif dibandingkan Jakarta atau Bali guna memacu iklim investasi Free Trade Zone.
                </li>
                <li>
                  <strong>Perlindungan Waris & Penjualan Kembali:</strong> Properti Hak Pakai dapat diwariskan kepada ahli waris sah atau dipindahtangankan kembali ke WNI maupun sesama WNA.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-[#eff4ff] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[13px] text-[#75777d]">
                Tim legal kami mendampingi WNA dari Singapura, Malaysia, & internasional.
              </span>
              <a
                href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo, saya ingin konsultasi pembelian properti Batam untuk WNA (Foreign Buyer Consultation)')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors"
              >
                Konsultasi Legal WNA
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
