import React, { useState } from "react";
import { User, IdCard, Briefcase, Plus, Trash, RefreshCw, X, AlertCircle, Sparkles, Building2, Save } from "lucide-react";
import { OvertimeSettings, Signer } from "../types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OvertimeSettings;
  onSettingsUpdate: (settings: OvertimeSettings) => void;
  signers: Signer[];
  onAddSigner: (signer: Omit<Signer, "id" | "createdAt">) => void;
  onDeleteSigner: (id: string) => void;
  onResetSigners: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  settings,
  onSettingsUpdate,
  signers,
  onAddSigner,
  onDeleteSigner,
  onResetSigners,
}: ProfileModalProps) {
  // Local edit states for settings
  const [tempName, setTempName] = useState(settings.employeeName);
  const [tempBadge, setTempBadge] = useState(settings.employeeBadge || "K. 210250");
  const [tempDept, setTempDept] = useState(settings.department || "Inspeksi Teknik Rotating & Khusus");
  const [tempRate, setTempRate] = useState(settings.hourlyRate);
  const [tempTarget, setTempTarget] = useState(settings.monthlyTargetHours);

  // Signer form states
  const [signerName, setSignerName] = useState("");
  const [signerBadge, setSignerBadge] = useState("");
  const [signerPosition, setSignerPosition] = useState("");
  const [signerPlant, setSignerPlant] = useState<"Pabrik I" | "Pabrik II" | "Pabrik III" | "Umum">("Pabrik I");
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSettingsUpdate({
      ...settings,
      employeeName: tempName.trim() || "User",
      employeeBadge: tempBadge.trim() || "K. 210250",
      department: tempDept.trim() || "Inspeksi Teknik Rotating & Khusus",
      hourlyRate: tempRate,
      monthlyTargetHours: tempTarget,
    });
    onClose();
  };

  const handleAddSignerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!signerName.trim() || !signerBadge.trim() || !signerPosition.trim()) {
      setFormError("Semua kolom supervisor wajib diisi!");
      return;
    }

    onAddSigner({
      name: signerName.trim(),
      badge: signerBadge.trim(),
      position: signerPosition.trim(),
      plant: signerPlant,
    });

    // Reset signer form
    setSignerName("");
    setSignerBadge("");
    setSignerPosition("");
    setSignerPlant("Pabrik I");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
      <div className="relative bg-gradient-to-b from-slate-900 via-[#151c2c] to-slate-950 border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header decoration blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl border border-indigo-500/20">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">
                Profil Pengguna & Database Supervisor
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur identitas lembur Anda dan daftarkan penandatangan resmi SPL (Surat Perintah Lembur).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-white/5 cursor-pointer font-sans"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Dual Column Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scroll relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column Left (5 Cols): Profile Settings form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Biodata Karyawan (Lembur)
              </h4>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-400" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
                <p className="text-[9px] text-slate-500">Nama resmi yang tercantum di badge atau ID card perusahaan.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <IdCard className="w-3 h-3 text-indigo-400" /> Nomor Induk Karyawan / Badge
                </label>
                <input
                  type="text"
                  required
                  value={tempBadge}
                  onChange={(e) => setTempBadge(e.target.value)}
                  placeholder="Contoh: K. 210250"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
                <p className="text-[9px] text-slate-500">Nomor induk keanggotaan atau kode badge yang dicari otomatis di SPL.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-400" /> Bagian / Departemen
                </label>
                <input
                  type="text"
                  required
                  value={tempDept}
                  onChange={(e) => setTempDept(e.target.value)}
                  placeholder="Contoh: Inspeksi Teknik Rotating & Khusus"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
                <p className="text-[9px] text-slate-500">Asosiasi departemen Anda, akan terisi otomatis di kop surat SPL.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tarif / Jam (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    value={tempRate}
                    onChange={(e) => setTempRate(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Target Bulanan (Jam)</label>
                  <input
                    type="number"
                    min="1"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-slate-100 text-xs font-bold py-3 px-4 rounded-xl border border-indigo-500/30 font-sans shadow-lg shadow-indigo-600/10 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Biodata Profil
                </button>
              </div>
            </form>
          </div>

          {/* Column Right (7 Cols): Supervisor Authority Database and creation form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Database Supervisor (Pemberi Perintah)
                </h4>
              </div>
              <button
                type="button"
                onClick={onResetSigners}
                title="Reset Database ke list standar perusahaan Petrokimia"
                className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded transition-all cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Standar
              </button>
            </div>

            {/* Form: Add New Signer */}
            <form onSubmit={handleAddSignerSubmit} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3.5">
              <p className="text-[11px] font-bold text-slate-300">Tambah Supervisor TTD Baru:</p>
              
              {formError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Contoh: FERNANDEZ"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">NIK / No. Induk</label>
                  <input
                    type="text"
                    value={signerBadge}
                    onChange={(e) => setSignerBadge(e.target.value)}
                    placeholder="Contoh: 2084875"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Jabatan / Posisi Resmi</label>
                  <input
                    type="text"
                    value={signerPosition}
                    onChange={(e) => setSignerPosition(e.target.value)}
                    placeholder="Contoh: Smd I ITR Pabrik I"
                    className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Area Pabrik</label>
                  <select
                    value={signerPlant}
                    onChange={(e) => setSignerPlant(e.target.value as any)}
                    className="w-full bg-[#151c2c] border border-white/10 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="Pabrik I">Pabrik I</option>
                    <option value="Pabrik II">Pabrik II</option>
                    <option value="Pabrik III">Pabrik III</option>
                    <option value="Umum">Umum (Semua)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Mendaftarkan Supervisor
                </button>
              </div>
            </form>

            {/* List: Existing Signers Database */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scroll pr-1">
              {signers.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">Belum ada supervisor terdaftar di database.</p>
              ) : (
                signers.map((sig) => (
                  <div
                    key={sig.id}
                    className="px-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.08] rounded-2xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 block truncate">{sig.name}</span>
                        <span className="text-[8px] font-mono font-black uppercase text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/15">
                          {sig.plant}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate font-sans">
                        {sig.position} • NIK: <strong className="font-mono text-slate-300">{sig.badge}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteSigner(sig.id)}
                      title="Hapus"
                      className="p-1.5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="mt-auto px-6 py-4.5 border-t border-white/5 flex justify-end gap-2 bg-slate-950/40 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
