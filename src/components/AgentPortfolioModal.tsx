import React from 'react';
import { AgentItem, PropertyItem } from '../types';
import { PROPERTIES_LIST, BRAND_ASSETS } from '../data/mockData';

interface AgentPortfolioModalProps {
  agent: AgentItem | null;
  onClose: () => void;
  onSelectProperty: (property: PropertyItem) => void;
}

export const AgentPortfolioModal: React.FC<AgentPortfolioModalProps> = ({
  agent,
  onClose,
  onSelectProperty,
}) => {
  if (!agent) return null;

  // Filter properties or provide representative portfolio
  const agentProperties = PROPERTIES_LIST.filter(
    (p) => p.agentName.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0].toLowerCase())
  );

  const displayProperties = agentProperties.length > 0 ? agentProperties : PROPERTIES_LIST.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
        {/* Header with Agent Info */}
        <div className="flex items-start justify-between border-b border-[#eff4ff] pb-4">
          <div className="flex items-center gap-4">
            <img
              src={agent.photoUrl}
              alt={agent.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#0051d5]/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] font-bold text-[#0e1c2f]">{agent.name}</h3>
                <span className="bg-[#eff4ff] text-[#0051d5] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {agent.badge}
                </span>
              </div>
              <p className="text-[14px] text-[#0051d5] font-semibold">{agent.role}</p>
              <div className="flex items-center gap-3 text-[12px] text-[#44474c] mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#0e1c2f]">near_me</span>
                  {agent.districts}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-amber-500 text-[15px]">star</span>
                  {agent.rating} ({agent.dealsCount} deal sukses)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#75777d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Bio */}
        {agent.bio && (
          <p className="text-[14px] text-[#44474c] bg-[#f8f9ff] p-4 rounded-xl leading-relaxed border border-[#e5eeff]">
            "{agent.bio}"
          </p>
        )}

        {/* Portofolio Listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[16px] font-bold text-[#0e1c2f]">
              Portofolio Unit Terkelola ({agent.portfolioCount} Unit)
            </h4>
            <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Legalitas 100% Terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-[#f8f9ff] rounded-xl overflow-hidden border border-[#e5eeff] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={prop.imageUrl}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-[#0e1c2f]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {prop.category}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs text-[#0e1c2f] text-[12px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                    {prop.priceFormatted}
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-[14px] text-[#0e1c2f] line-clamp-1">{prop.title}</h5>
                    <p className="text-[12px] text-[#75777d] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {prop.location}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-[#44474c] pt-2">
                      <span>LT: {prop.landArea}m²</span>
                      <span>•</span>
                      <span>LB: {prop.buildingArea}m²</span>
                      <span>•</span>
                      <span className="text-[#0051d5] font-medium">{prop.legalStatus.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectProperty(prop);
                      }}
                      className="flex-1 bg-[#0e1c2f] text-white hover:bg-[#0051d5] text-[12px] font-semibold py-2 rounded-lg transition-colors"
                    >
                      Lihat Detail Unit
                    </button>
                    <a
                      href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=Halo%20${encodeURIComponent(agent.name)},%20saya%20tertarik%20dengan%20unit%20${encodeURIComponent(prop.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors"
                      title="WhatsApp Konsultan"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#eff4ff]">
          <p className="text-[13px] text-[#75777d]">
            Didampingi langsung oleh {agent.name} tanpa perantara bebas markup.
          </p>
          <a
            href={`https://wa.me/${BRAND_ASSETS.phoneRaw}?text=Halo%20${encodeURIComponent(agent.name)},%20saya%20ingin%20jadwalkan%20survei%20unit%20di%20${encodeURIComponent(agent.districts)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0051d5] hover:bg-[#316bf3] text-white px-6 py-2.5 rounded-full text-[13px] font-semibold transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Hubungi {agent.name} via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
