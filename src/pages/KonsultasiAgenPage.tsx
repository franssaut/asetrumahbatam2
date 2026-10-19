import React, { useState } from 'react';
import { AgentItem, PropertyItem } from '../types';
import { AGENTS_LIST, BRAND_ASSETS } from '../data/mockData';
import { AgentPortfolioModal } from '../components/AgentPortfolioModal';
import { submitConsultationBooking } from '../lib/supabase';
import { getStoredUser } from '../lib/auth';

interface KonsultasiAgenPageProps {
  onSelectProperty: (property: PropertyItem) => void;
}

export const KonsultasiAgenPage: React.FC<KonsultasiAgenPageProps> = ({ onSelectProperty }) => {
  const currentUser = getStoredUser();
  const [selectedAgentForPortfolio, setSelectedAgentForPortfolio] = useState<AgentItem | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: currentUser?.fullName || '',
    phone: currentUser?.phone ? currentUser.phone.replace(/\D/g, '') : '',
    agentId: 'hendry-tan',
    date: '',
    timeSlot: 'Pagi (09:00 - 12:00)',
    interests: 'Rumah Mewah (Sukajadi / Batam Center)',
  });

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenAgent = AGENTS_LIST.find((a) => a.id === scheduleForm.agentId) || AGENTS_LIST[0];

    // Save booking request to Supabase
    await submitConsultationBooking({
      userId: currentUser?.id,
      name: scheduleForm.name,
      phone: scheduleForm.phone,
      agentId: scheduleForm.agentId,
      timeSlot: scheduleForm.timeSlot,
      interests: scheduleForm.interests,
    });

    const message =
      `*PENJADWALAN SURVEI & KONSULTASI AGEN*\n\n` +
      `*Nama Pemohon:* ${scheduleForm.name}\n` +
      `*WhatsApp:* +62 ${scheduleForm.phone}\n` +
      `*Konsultan Pilihan:* ${chosenAgent.name} (${chosenAgent.specialty})\n` +
      `*Rencana Tanggal:* ${scheduleForm.date || 'Besok / Fleksibel'}\n` +
      `*Waktu Preferensi:* ${scheduleForm.timeSlot}\n` +
      `*Minat Unit:* ${scheduleForm.interests}\n\n` +
      `Mohon konfirmasi ketersediaan agenda survei privat bersama konsultan.`;

    window.open(`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(message)}`, '_blank');
    setScheduleSuccess(true);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Hero & Trust Metrics */}
      <section className="relative w-full overflow-hidden bg-[#0e1c2f] text-white py-16 md:py-20 border-b border-[#213145]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1c2f] via-[#213145] to-[#0e1c2f] opacity-95 pointer-events-none"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#316bf3]/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#0051d5]/15 blur-2xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-6">
          {/* Breadcrumb & Licensing Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-[#dbe1ff]">verified</span>
              Layanan Konsultan Properti Berlisensi AREBI Batam
            </span>
            <span className="text-[#77849c] text-[13px]">• Transaksi Legal & Terverifikasi BP Batam</span>
          </div>

          {/* Main Headline & Subtitle */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-[32px] md:text-[46px] font-extrabold text-white tracking-tight leading-tight">
                Konsultasi Properti & Pendampingan Investasi Terpercaya di Batam
              </h1>
              <p className="text-[16px] md:text-[18px] text-[#bac7e1] max-w-2xl leading-relaxed">
                Diskusikan kebutuhan hunian impian, aset komersial, hingga legalitas transaksi bersama tim konsultan spesialis kawasan Sukajadi, Batam Center, Nagoya, hingga resort tepi pantai Nongsa.
              </p>
            </div>

            {/* Metric Highlights */}
            <div className="lg:col-span-4 flex flex-col gap-2.5 bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5 text-white text-[13px] font-semibold">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[20px]">gavel</span>
                <span>Didampingi Notaris Rekanan Resmi</span>
              </div>
              <div className="flex items-center gap-2.5 text-white text-[13px] font-semibold">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[20px]">bolt</span>
                <span>Respon Cepat &lt; 15 Menit via Concierge</span>
              </div>
              <div className="flex items-center gap-2.5 text-white text-[13px] font-semibold">
                <span className="material-symbols-outlined text-[#dbe1ff] text-[20px]">verified</span>
                <span>100% Validasi UWTO & Sertifikat Bebas Sengketa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certified Agents Directory Section */}
      <section className="w-full py-16 md:py-20 bg-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
                Direktori Spesialis
              </span>
              <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0e1c2f] tracking-tight">
                Pilih Konsultan Spesialis Kawasan Anda
              </h2>
              <p className="text-[14px] text-[#44474c]">
                Konsultan berlisensi AREBI dengan rekam jejak teruji siap mendampingi survei unit langsung ke lapangan secara profesional dan independen.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-[12px] font-semibold text-[#44474c] bg-white px-3.5 py-1.5 rounded-full border border-[#dbe1ff]">
              <span className="material-symbols-outlined text-[#0051d5] text-[18px]">verified_user</span>
              <span>Seluruh konsultan menandatangani pakta integritas bebas markup harga</span>
            </div>
          </div>

          {/* 4 Agents Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AGENTS_LIST.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-[#e5eeff]"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={agent.photoUrl}
                    alt={agent.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-[#0e1c2f]/85 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[12px] font-bold flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                    <span>{agent.rating}</span>
                    <span className="text-[#77849c] text-[10px]">({agent.dealsCount} deal)</span>
                  </div>

                  {/* Specialization Badge */}
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[#0051d5] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                    {agent.badge}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-bold text-[#0e1c2f]">{agent.name}</h3>
                    <p className="text-[12px] text-[#0051d5] font-semibold">{agent.role}</p>
                    <div className="flex items-center gap-1 text-[#44474c] text-[12px] pt-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#0e1c2f]">near_me</span>
                      <span>{agent.districts}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <a
                      href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent(`Halo ${agent.name}, saya ingin konsultasi properti di kawasan ${agent.districts}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-[#0051d5] hover:bg-[#316bf3] text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Konsultasi WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedAgentForPortfolio(agent)}
                      className="w-full inline-flex items-center justify-center py-2 px-3 rounded-full bg-[#f8f9ff] hover:bg-[#dce9ff] text-[#0e1c2f] text-[12px] font-semibold transition-colors border border-[#e5eeff] cursor-pointer"
                    >
                      Lihat Portofolio ({agent.portfolioCount} Unit)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Transaction Workflow */}
      <section className="w-full py-16 md:py-20 bg-white border-b border-[#eff4ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-widest">
              Transparansi Prosedur
            </span>
            <h2 className="text-[28px] md:text-[36px] font-extrabold text-[#0e1c2f]">
              Alur Pendampingan Transaksi Properti
            </h2>
            <p className="text-[14px] text-[#44474c]">
              Kami menyederhanakan regulasi khas Batam dengan proses yang transparan, terukur, dan didukung praktisi hukum berizin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-[#f8f9ff] rounded-2xl p-6 border border-[#e5eeff] shadow-xs space-y-3 relative hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0051d5] text-white text-[16px] font-bold flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-[17px] font-bold text-[#0e1c2f]">Diskusi Kriteria & Budget</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Konsultasi mendalam mengenai kebutuhan ruang, preferensi lifestyle keluarga, serta simulasi proyeksi cash flow bila ditujukan untuk disewakan.
              </p>
              <div className="text-[#0051d5] text-[12px] font-semibold pt-2 flex items-center gap-1 border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Profiling Kebutuhan Akurat</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#f8f9ff] rounded-2xl p-6 border border-[#e5eeff] shadow-xs space-y-3 relative hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-[#316bf3] text-white text-[16px] font-bold flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-[17px] font-bold text-[#0e1c2f]">Kurasi & Survei Lapangan</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Penjadwalan inspeksi properti secara privat tanpa terburu-buru, didampingi konsultan untuk meninjau detail fisik dan potensi lingkungan sekitar.
              </p>
              <div className="text-[#0051d5] text-[12px] font-semibold pt-2 flex items-center gap-1 border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Armada Survei Privat Tersedia</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#f8f9ff] rounded-2xl p-6 border border-[#e5eeff] shadow-xs space-y-3 relative hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-[#0e1c2f] text-white text-[16px] font-bold flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-[17px] font-bold text-[#0e1c2f]">Verifikasi BPN & BP Batam</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Pemeriksaan riwayat faktur UWTO, status Fatwa Planologi, bebas sengketa di BPN, dan kepastian izin mendirikan bangunan (PBG/IMB).
              </p>
              <div className="text-[#0051d5] text-[12px] font-semibold pt-2 flex items-center gap-1 border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Due Diligence Menyeluruh</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#f8f9ff] rounded-2xl p-6 border border-[#e5eeff] shadow-xs space-y-3 relative hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white text-[16px] font-bold flex items-center justify-center shadow-md">
                4
              </div>
              <h3 className="text-[17px] font-bold text-[#0e1c2f]">Negosiasi & Akad Notaris</h3>
              <p className="text-[13px] text-[#44474c] leading-relaxed">
                Negosiasi harga transparan langsung ke pemilik serta pendampingan tanda tangan Akta Jual Beli (AJB) di hadapan Notaris/PPAT rekanan terpercaya.
              </p>
              <div className="text-[#0051d5] text-[12px] font-semibold pt-2 flex items-center gap-1 border-t border-[#e5eeff]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Legalitas Sah & Bergaransi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Booking Schedule Form */}
      <section className="w-full py-16 bg-[#eff4ff]">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-[#e5eeff]">
            <div className="max-w-xl mb-6">
              <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider block">
                Jadwalkan Konsultasi Langsung
              </span>
              <h2 className="text-[24px] md:text-[28px] font-bold text-[#0e1c2f] mt-1">
                Atur Waktu Survei Privat & Temu Konsultan
              </h2>
              <p className="text-[13px] text-[#44474c] mt-1">
                Tentukan konsultan spesialis kawasan dan preferensi waktu Anda, tim kami akan menyiapkan data unit dan menjemput Anda di lokasi.
              </p>
            </div>

            {scheduleSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">event_available</span>
                <p className="text-[13px] font-medium">
                  Permintaan survei berhasil diformulasikan ke WhatsApp konsultan Anda. Tim kami segera mengonfirmasi jadwal.
                </p>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="Contoh: Hendra Wijaya"
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Nomor WhatsApp</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[13px] font-bold text-[#44474c]">+62</span>
                    <input
                      type="tel"
                      required
                      value={scheduleForm.phone}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, phone: e.target.value })}
                      placeholder="823-9105-9216"
                      className="w-full bg-[#eff4ff] rounded-xl pl-12 pr-4 py-3 text-[14px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Pilih Konsultan</label>
                  <select
                    value={scheduleForm.agentId}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, agentId: e.target.value })}
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent cursor-pointer"
                  >
                    {AGENTS_LIST.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.districts})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Pilihan Waktu</label>
                  <select
                    value={scheduleForm.timeSlot}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, timeSlot: e.target.value })}
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent cursor-pointer"
                  >
                    <option value="Pagi (09:00 - 12:00)">Pagi (09:00 - 12:00)</option>
                    <option value="Siang (13:00 - 15:30)">Siang (13:00 - 15:30)</option>
                    <option value="Sore (16:00 - 18:00)">Sore (16:00 - 18:00)</option>
                    <option value="Weekend (Sabtu/Minggu)">Akhir Pekan (Sabtu/Minggu)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-semibold text-[#0b1c30]">Minat Kategori</label>
                  <input
                    type="text"
                    value={scheduleForm.interests}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interests: e.target.value })}
                    placeholder="Rumah Mewah / Ruko / Tanah"
                    className="w-full bg-[#eff4ff] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0e1c2f] hover:bg-[#0051d5] text-white py-3.5 px-6 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>Kirim Jadwal Konsultasi ke WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Final Call to Action Strip */}
      <section className="w-full py-16 bg-[#0e1c2f] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-gradient-to-r from-[#213145] via-[#0e1c2f] to-[#316bf3]/30 p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
            <div className="space-y-1 max-w-xl text-center md:text-left">
              <h2 className="text-[24px] md:text-[30px] font-bold text-white">
                Siap Menemukan Aset Terbaik di Batam?
              </h2>
              <p className="text-[14px] text-[#bac7e1]">
                Jadikan keputusan investasi Anda aman dan terencana. Konsultasikan langsung dengan konsultan senior kami hari ini.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0051d5] hover:bg-[#316bf3] text-white text-[14px] font-bold transition-all shadow-md cursor-pointer"
                href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=${encodeURIComponent('Halo Aset Rumah Batam, saya ingin jadwalkan survei properti')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                <span>WhatsApp Kami</span>
              </a>
              <a
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[14px] font-semibold transition-all border border-white/20 cursor-pointer"
                href={`tel:${BRAND_ASSETS.phoneRaw}`}
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                <span>Telepon Langsung</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Portfolio Modal */}
      {selectedAgentForPortfolio && (
        <AgentPortfolioModal
          agent={selectedAgentForPortfolio}
          onClose={() => setSelectedAgentForPortfolio(null)}
          onSelectProperty={(prop) => {
            setSelectedAgentForPortfolio(null);
            onSelectProperty(prop);
          }}
        />
      )}
    </div>
  );
};
