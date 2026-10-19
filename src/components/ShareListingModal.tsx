import React, { useState } from 'react';
import { PropertyItem } from '../types';
import { 
  getPropertyAbsoluteUrl, 
  getPropertyWhatsAppShareUrl, 
  copyPropertyLinkToClipboard,
  sharePropertyNative
} from '../lib/navigation';

interface ShareListingModalProps {
  property: PropertyItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareListingModal: React.FC<ShareListingModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  const absoluteUrl = getPropertyAbsoluteUrl(property.id);
  const waUrl = getPropertyWhatsAppShareUrl(property);

  const handleCopy = async () => {
    const success = await copyPropertyLinkToClipboard(property.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    await sharePropertyNative(property);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#e5eeff] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eff4ff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center font-bold text-xl">
              <span className="material-symbols-outlined text-[22px]">share</span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#0e1c2f]">Bagikan Listing Properti</h3>
              <p className="text-[12px] text-[#75777d]">Tautan unik langsung ke halaman unit ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#75777d] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Property Brief Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#f8f9ff] border border-[#e5eeff]">
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-16 h-16 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-[#0051d5] bg-blue-50 px-2 py-0.5 rounded-md">
              {property.category}
            </span>
            <h4 className="text-[14px] font-bold text-[#0e1c2f] truncate mt-0.5">
              {property.title}
            </h4>
            <p className="text-[13px] font-extrabold text-[#0051d5]">
              {property.priceFormatted} {property.period || ''}
            </p>
          </div>
        </div>

        {/* Direct Link Input & Copy Button */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#0e1c2f] uppercase tracking-wider block">
            Link Langsung Halaman (Direct Page URL)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#eff4ff] rounded-xl px-3.5 py-2.5 flex items-center gap-2 overflow-hidden border border-transparent focus-within:border-[#0051d5] focus-within:bg-white transition-all">
              <span className="material-symbols-outlined text-[18px] text-[#75777d] shrink-0">link</span>
              <input
                type="text"
                readOnly
                value={absoluteUrl}
                onFocus={(e) => e.target.select()}
                className="w-full bg-transparent text-[13px] text-[#0e1c2f] font-mono focus:outline-none truncate selection:bg-[#0051d5] selection:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0051d5] hover:bg-[#316bf3] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
            </button>
          </div>
        </div>

        {/* Share Channels */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold text-[#75777d] uppercase tracking-wider">
            Bagikan Cepat Ke:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Kirim ke WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 bg-[#0e1c2f] hover:bg-[#0051d5] text-white py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Menu Bagikan...</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {copied && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[12px] flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
            <span>Tautan berhasil disalin ke clipboard! Siap Anda kirimkan ke pembeli/klien.</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-[#eff4ff] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-[#75777d] hover:text-[#0e1c2f] font-semibold px-4 py-2 rounded-lg hover:bg-[#eff4ff] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
