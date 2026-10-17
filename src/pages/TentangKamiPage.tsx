import React, { useState } from 'react';
import { PageId } from '../types';
import { BRAND_ASSETS, LEADERSHIP_TEAM } from '../data/mockData';

interface TentangKamiPageProps {
  onNavigate: (page: PageId) => void;
}

export const TentangKamiPage: React.FC<TentangKamiPageProps> = ({ onNavigate }) => {
  const [showToast, setShowToast] = useState(false);

  const copyOfficeContact = () => {
    navigator.clipboard.writeText(BRAND_ASSETS.phone);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0e1c2f] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 border border-[#213145]">
          <span className="material-symbols-outlined text-[#dbe1ff] text-[20px]">check_circle</span>
          <span className="text-[13px] font-medium">Nomor kontak resmi disalin ke clipboard</span>
        </div>
      )}

      {/* SECTION 1: HERO & CREDIBILITY HIGHLIGHTS */}
      <section className="relative w-full bg-white overflow-hidden pb-16 pt-12 md:pt-16 border-b border-[#eff4ff]">
        {/* Subtle architectural background aura */}
        <div className="absolute -top-32 right-0 w-[550px] h-[550px] bg-[#dbe1ff]/30 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute top-1/2 -left-32 w-[400px] h-[400px] bg-[#dce9ff]/40 rounded-full blur-2xl pointer-events-none -z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          {/* Overline Tag */}
          <div className="flex items-center gap-2 text-[#0051d5] mb-4">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0051d5] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5]">
              Tentang Aset Rumah Batam
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Title & Story Column */}
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-[34px] md:text-[46px] font-extrabold text-[#0b1c30] tracking-tight leading-tight">
                Membangun Kepercayaan & <span className="text-[#0051d5]">Nilai Investasi Properti</span> di Batam
              </h1>
              <p className="text-[16px] md:text-[18px] text-[#44474c] leading-relaxed">
                Sejak 2015, Aset Rumah Batam mendampingi ribuan keluarga dan investor meraih kepemilikan aset hunian premium, villa, dan properti komersial strategis dengan jaminan legalitas transparan serta kepatuhan regulasi terdepan.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  className="inline-flex items-center justify-center gap-2 bg-[#0051d5] text-white hover:bg-[#316bf3] text-[14px] font-semibold px-6 py-3 rounded-full shadow-[0_4px_16px_rgba(0,81,213,0.22)] transition-all cursor-pointer"
                  href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo, saya ingin konsultasi privat bersama tim Aset Rumah Batam')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Konsultasi Privat Agen</span>
                </a>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] text-[14px] font-semibold px-6 py-3 rounded-full transition-all cursor-pointer border border-[#dbe1ff]"
                  onClick={copyOfficeContact}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#0051d5]">share</span>
                  <span>Salin Kontak Representatif</span>
                </button>
              </div>
            </div>

            {/* Featured Media Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#dce9ff] aspect-[4/3] group border border-[#eff4ff]">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Kantor Pusat Operasional Aset Rumah Batam di Batam Center"
                  src={BRAND_ASSETS.officeHq}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c2f]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#0051d5] font-bold">
                        Kantor Pusat Operasional
                      </p>
                      <p className="text-[13px] font-bold text-[#0e1c2f]">
                        Komp. Mahkota Raya Blok A, Batam Center
                      </p>
                    </div>
                    <div className="flex items-center text-[#0051d5]">
                      <span className="material-symbols-outlined text-[24px]">verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: VISI & MISI KAMI (2 Elegant Asymmetrical Cards) */}
      <section className="w-full bg-[#f8f9ff] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5]">
              Landasan Filosofi
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0b1c30] tracking-tight mt-1">
              Komitmen Visi & Misi Jangka Panjang
            </h2>
            <p className="text-[15px] text-[#44474c] mt-2 leading-relaxed">
              Kami menempatkan keamanan yuridis dan pertumbuhan kapital klien sebagai tolok ukur utama setiap rekomendasi properti yang kami berikan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visi Card (Navy Luxury Container) */}
            <div className="bg-[#0e1c2f] text-white p-8 md:p-10 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#0051d5]/20 rounded-full blur-2xl"></div>
              <div className="relative z-10 space-y-5">
                <div className="w-12 h-12 rounded-xl bg-[#0051d5] flex items-center justify-center text-white shadow-md">
                  <span className="material-symbols-outlined text-[26px]">visibility</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#dbe1ff]">
                    Visi Strategis
                  </span>
                  <h3 className="text-[22px] md:text-[26px] font-bold text-white tracking-tight leading-snug">
                    Menjadi Benchmark Utama Broker Properti Berintegritas di Kepulauan Riau
                  </h3>
                </div>
                <p className="text-[14px] text-[#77849c] leading-relaxed">
                  Menghubungkan pembeli domestik dan mancanegara secara aman dengan potensi investasi emas Batam melalui portofolio terkurasi, standar kepatuhan hukum ketat, dan teknologi pencarian properti yang transparan.
                </p>
              </div>

              <div className="relative z-10 pt-6 mt-6 border-t border-[#213145] flex items-center gap-2 text-white text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[18px]">explore</span>
                <span>Fokus Wilayah: Batam, Barelang, Bintan, & Koridor Maritim Kepri</span>
              </div>
            </div>

            {/* Misi Card (Clean Surface with Detailed Checkpoints) */}
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#e5eeff] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-xl bg-[#dce9ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[26px]">flag</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#0051d5]">
                    Tiga Pilar Misi
                  </span>
                  <h3 className="text-[22px] md:text-[26px] font-bold text-[#0b1c30] tracking-tight">
                    Pelayanan Tanpa Kompromi untuk Setiap Klien
                  </h3>
                </div>

                <ul className="space-y-4 pt-2">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#0051d5] text-[22px] mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#0b1c30]">
                        Transparansi Harga Tanpa Markup Sepihak
                      </h4>
                      <p className="text-[13px] text-[#44474c] leading-relaxed">
                        Struktur harga langsung dari pemilik atau developer resmi dengan skema biaya transaksi dan pajak yang dijabarkan transparan sejak awal.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#0051d5] text-[22px] mt-0.5 shrink-0">
                      gavel
                    </span>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#0b1c30]">
                        Edukasi Regulasi UWTO & Perizinan BP Batam
                      </h4>
                      <p className="text-[13px] text-[#44474c] leading-relaxed">
                        Panduan menyeluruh mengenai siklus Uang Wajib Tahunan Otorita (UWTO), Fatwa Planologi, hingga peralihan hak WNA sesuai PP Nomor 18 Tahun 2021.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#0051d5] text-[22px] mt-0.5 shrink-0">
                      concierge
                    </span>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#0b1c30]">
                        Layanan Concierge End-to-End
                      </h4>
                      <p className="text-[13px] text-[#44474c] leading-relaxed">
                        Dukungan total mulai penjemputan survei, appraisal independen, negosiasi, pengurusan akta notaris, hingga serah terima fisik kunci unit.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CORE VALUES (Nilai-Nilai Fondasi Kami) */}
      <section className="w-full bg-white py-16 md:py-20 border-y border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5]">
              Standard Operasional & Budaya
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0b1c30] tracking-tight mt-1">
              Nilai-Nilai Fondasi Kami
            </h2>
            <p className="text-[15px] text-[#44474c] mt-2">
              Kami membedakan diri dari broker konvensional lewat kedalaman verifikasi faktual dan rasa kepemilikan atas investasi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Value 1 */}
            <div className="bg-[#eff4ff] p-6 md:p-8 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all border border-[#e5eeff]">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#0051d5] flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">fact_check</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                  Integritas & Transparansi Regulasi
                </h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Setiap listing melewati validasi riwayat faktur UWTO BP Batam, status peruntukan ruang (Fatwa Planologi), sertifikat HGB murni, dan pengecekan silang sengketa di BPN Batam sebelum ditayangkan.
                </p>
              </div>
              <div className="pt-4 mt-4 text-[#0051d5] text-[13px] flex items-center gap-1 font-bold border-t border-[#dbe1ff]">
                <span>Audit Legal 100% Clear</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </div>
            </div>

            {/* Value 2 */}
            <div className="bg-[#eff4ff] p-6 md:p-8 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all border border-[#e5eeff]">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#0051d5] flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">location_city</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                  Keahlian Hiper-Lokal Batam
                </h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Memahami denyut pertumbuhan tiap distrik dengan cermat: dari pusat bisnis Nagoya & Batam Center, hunian prestisius Sukajadi & Palm Spring, hingga koridor pariwisata marina & villa mewah Nongsa.
                </p>
              </div>
              <div className="pt-4 mt-4 text-[#0051d5] text-[13px] flex items-center gap-1 font-bold border-t border-[#dbe1ff]">
                <span>Wawasan Presisi Regional</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </div>
            </div>

            {/* Value 3 */}
            <div className="bg-[#eff4ff] p-6 md:p-8 rounded-2xl flex flex-col justify-between group hover:shadow-lg transition-all border border-[#e5eeff]">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#0051d5] flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[30px]">handshake</span>
                </div>
                <h3 className="text-[18px] font-bold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                  Pendampingan End-to-End
                </h3>
                <p className="text-[14px] text-[#44474c] leading-relaxed">
                  Pengawalan personal sejak formulasi kriteria awal, kurasi jadwal inspeksi unit eksklusif, asistensi negosiasi, mediasi di hadapan notaris/PPAT, sampai pemindahan utilitas air ATB dan kelistrikan PLN Batam.
                </p>
              </div>
              <div className="pt-4 mt-4 text-[#0051d5] text-[13px] flex items-center gap-1 font-bold border-t border-[#dbe1ff]">
                <span>Konsultasi Berkesinambungan</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: TIM PIMPINAN (Leadership Executive) */}
      <section className="w-full bg-[#f8f9ff] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5]">
                Integritas Kepemimpinan
              </span>
              <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0b1c30] tracking-tight mt-1">
                Tim Pimpinan Eksekutif
              </h2>
              <p className="text-[15px] text-[#44474c] mt-2 max-w-xl">
                Profesional berpengalaman dengan dedikasi tinggi mengawal transaksi investasi bernilai tinggi dengan transparansi mutlak.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[#44474c] text-[13px] font-semibold">
              <span className="material-symbols-outlined text-[#0051d5] text-[20px]">security</span>
              <span>Sertifikasi Broker Kompeten BNSP & AREBI</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LEADERSHIP_TEAM.map((exec, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group border border-[#e5eeff]"
              >
                <div className="relative aspect-[4/5] bg-[#dce9ff] overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={exec.name}
                    src={exec.photoUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1c2f]/85 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0051d5] text-white text-[11px] font-bold uppercase tracking-wide">
                      {exec.badge}
                    </span>
                    <h3 className="text-[18px] font-bold text-white mt-1.5">{exec.name}</h3>
                    <p className="text-[13px] text-[#dbe1ff]">{exec.role}</p>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-[13px] text-[#44474c] italic leading-relaxed">
                    "{exec.quote}"
                  </p>
                  <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[#44474c] text-[13px]">
                    <span className="text-[#0051d5] font-bold">{exec.experience}</span>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0e1c2f] hover:text-[#0051d5] flex items-center gap-0.5 font-semibold text-[12px]"
                    >
                      <span>LinkedIn</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: CALL TO ACTION BANNER */}
      <section className="w-full bg-white py-16 md:py-20 border-t border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative bg-[#0e1c2f] rounded-3xl p-8 md:p-14 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#0051d5]/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 left-1/4 w-80 h-80 bg-[#316bf3]/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4 text-white">
                <div className="inline-flex items-center gap-1.5 bg-white/10 text-[#dbe1ff] px-3.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  <span className="text-[12px] font-semibold">Konsultasi Tanpa Biaya</span>
                </div>
                <h2 className="text-[26px] md:text-[36px] font-extrabold text-white tracking-tight leading-tight">
                  Konsultasikan Kebutuhan Investasi Anda Bersama Kami
                </h2>
                <p className="text-[15px] md:text-[17px] text-[#77849c] max-w-2xl leading-relaxed">
                  Apakah Anda sedang mencari hunian impian keluarga di Sukajadi, ruko strategis di Nagoya, atau aset kavling industri berizin resmi? Tim broker berlisensi kami siap mendampingi langkah Anda.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
                <a
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#0051d5] text-white hover:bg-[#316bf3] text-[14px] font-bold px-6 py-4 rounded-full shadow-[0_4px_20px_rgba(0,81,213,0.3)] transition-all text-center cursor-pointer"
                  href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo Aset Rumah Batam, saya ingin berkonsultasi mengenai properti')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>Hubungi Tim Kami via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => onNavigate('katalog-properti')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#0e1c2f] hover:bg-[#eff4ff] text-[14px] font-bold px-6 py-4 rounded-full transition-all text-center cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#0051d5]">domain</span>
                  <span>Lihat Katalog Properti</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
