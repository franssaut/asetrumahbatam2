import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'schema' | 'data'>('config');
  const [localSubmissions, setLocalSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);

      try {
        const subs = JSON.parse(localStorage.getItem('arb_local_submissions') || '[]');
        setLocalSubmissions(subs);
      } catch (e) {
        setLocalSubmissions([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSupabaseConfig({ url, anonKey });
    setTestResult({ success: true, message: 'Konfigurasi kredensial Supabase berhasil disimpan!' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection({ url, anonKey });
    setTesting(false);
    setTestResult(res);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isConfigured = Boolean(url && anonKey && !url.includes('your-project'));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-[#e5eeff] max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eff4ff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3ecf8e]/10 text-[#3ecf8e] flex items-center justify-center font-bold text-xl border border-[#3ecf8e]/30">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold text-[#0e1c2f]">Integrasi Supabase Database</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConfigured ? 'Terkonfigurasi' : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-[12px] text-[#75777d]">
                Penyimpanan cloud PostgreSQL untuk listing, formulir titip properti & booking survei.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#75777d] hover:bg-[#eff4ff] hover:text-[#0b1c30]"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#eff4ff] pb-2 text-[13px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'config'
                ? 'bg-[#0e1c2f] text-white'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Pengaturan API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'schema'
                ? 'bg-[#0e1c2f] text-white'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Script SQL Tabel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'data'
                ? 'bg-[#0e1c2f] text-white'
                : 'text-[#44474c] hover:bg-[#eff4ff]'
            }`}
          >
            Data Masuk ({localSubmissions.length})
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0e1c2f] uppercase tracking-wider">
                Project URL Supabase
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-[#eff4ff] rounded-xl px-4 py-2.5 text-[13px] text-[#0e1c2f] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
              />
              <p className="text-[11px] text-[#75777d]">
                Didapatkan dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</em>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-[#0e1c2f] uppercase tracking-wider">
                Project API Anon Key (Public)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#eff4ff] rounded-xl px-4 py-2.5 text-[13px] text-[#0e1c2f] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0051d5] border border-transparent"
              />
              <p className="text-[11px] text-[#75777d]">
                Didapatkan dari: <em>Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API Keys &gt; anon public</em>
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-[13px] flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  {testResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto bg-[#0e1c2f] hover:bg-[#0051d5] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
              >
                Simpan Konfigurasi
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={handleTest}
                className="w-full sm:w-auto bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0051d5] border border-[#dbe1ff] px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {testing ? (
                  <span>Menguji...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>Uji Koneksi Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: SQL Schema */}
        {activeTab === 'schema' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#44474c]">
                Jalankan script ini di <strong>Supabase Dashboard &gt; SQL Editor</strong> untuk membuat tabel otomatis:
              </p>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1 bg-[#0051d5] text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-[#316bf3] transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedSql ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            <pre className="bg-[#0e1c2f] text-[#bac7e1] p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* Tab 3: Local/Recent Data View */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[#75777d]">
              Data pengajuan properti terbaru yang tersimpan di sistem:
            </p>

            {localSubmissions.length === 0 ? (
              <div className="text-center py-8 bg-[#f8f9ff] rounded-xl border border-[#eff4ff] text-[#75777d] text-[13px]">
                Belum ada data pengajuan titip properti masuk.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {localSubmissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-[12px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[#0e1c2f]">
                      <span>{sub.owner_name} ({sub.property_type})</span>
                      <span className="text-[#0051d5]">Rp {sub.estimated_price}</span>
                    </div>
                    <p className="text-[#75777d]">{sub.region} • {sub.address}</p>
                    <p className="text-[#44474c] text-[11px]">WA: +62 {sub.owner_whatsapp} • {sub.legal_status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-[#eff4ff] flex items-center justify-between text-[12px] text-[#75777d]">
          <span>Terintegrasi dengan Supabase SDK JS</span>
          <button
            onClick={onClose}
            className="text-[#0e1c2f] hover:underline font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
