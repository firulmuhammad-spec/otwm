import React, { useState, useEffect } from "react";
import { X, FileText, Printer, Check, Info, FileSpreadsheet, Sparkles } from "lucide-react";
import { OvertimeLog, OvertimeSettings, Signer } from "../types";
import { exportSPLToWord, printSPLToPDF, getIndonesianDayName, formatIndonesianDate } from "../utils/splExporter";

interface SPLExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: OvertimeLog | null;
  settings: OvertimeSettings;
  signers: Signer[];
}

export default function SPLExportModal({
  isOpen,
  onClose,
  log,
  settings,
  signers,
}: SPLExportModalProps) {
  const [selectedSignerId, setSelectedSignerId] = useState<string>("");

  // Sync suggestion of signer based on the log's plant when log or signers change
  useEffect(() => {
    if (log && signers.length > 0) {
      const logPlant = log.plant || "Umum";
      
      // Look for a signer that matches this plant exactly
      const matchingSigner = signers.find(
        (s) => s.plant.toLowerCase() === logPlant.toLowerCase()
      );

      if (matchingSigner) {
        setSelectedSignerId(matchingSigner.id);
      } else {
        // Fallback to "Umum" or the first signer
        const generalSigner = signers.find((s) => s.plant === "Umum") || signers[0];
        if (generalSigner) {
          setSelectedSignerId(generalSigner.id);
        }
      }
    }
  }, [log, signers]);

  if (!isOpen || !log) return null;

  const currentSigner = signers.find((s) => s.id === selectedSignerId) || signers[0];

  const handleDownloadWord = () => {
    if (!currentSigner) return;
    exportSPLToWord(log, settings, currentSigner);
  };

  const handlePrintPDF = () => {
    if (!currentSigner) return;
    printSPLToPDF(log, settings, currentSigner);
  };

  const dayName = getIndonesianDayName(log.date);
  const formattedDate = formatIndonesianDate(log.date);
  const depUpper = (settings.department || "INSPEKSI TEKNIK ROTATING & KHUSUS").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
      <div className="relative bg-gradient-to-b from-slate-900 via-[#151c2c] to-slate-950 border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl border border-indigo-500/20">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 font-sans">
                Unduh Surat Perintah Lembur (SPL)
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih penandatangan dari database dan unduh dalam format Word (.doc) atau cetak ke PDF.
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

        {/* Modal Content - Side by Side Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scroll relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (5 Cols) - Setup Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3.5">
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold block mb-1">
                📍 Deteksi Rincian Log
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block">Tanggal Lembur</label>
                  <strong className="text-slate-300 font-mono">{log.date}</strong>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block font-normal">Pabrik & Sub-Plant</label>
                  <strong className="text-emerald-400 font-normal">
                    {log.plant || "Umum"} {log.subPlant ? `• ${log.subPlant}` : ""}
                  </strong>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block font-normal">Uraian Pekerjaan</label>
                <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{log.activity}</p>
              </div>
            </div>

            {/* Dropdown to SELECT SIGNER */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Pilih Penandatangan (Tanda Tangan)
              </label>
              
              {signers.length === 0 ? (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/15 text-rose-300 rounded-xl text-xs flex gap-2">
                  <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Database Kosong!</span>
                    <p className="text-[10px] text-rose-400/90 mt-0.5">
                      Silakan hubungkan akun Anda atau buka menu Profil untuk mereset daftar penandatangan standar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedSignerId}
                    onChange={(e) => setSelectedSignerId(e.target.value)}
                    className="w-full bg-[#151c2c] border border-white/10 text-xs text-slate-200 px-3.5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 transition-all font-semibold"
                  >
                    {signers.map((sig) => {
                      const isMatch = sig.plant.toLowerCase() === (log.plant || "Umum").toLowerCase();
                      return (
                        <option key={sig.id} value={sig.id}>
                          {sig.name} ({sig.position}) {isMatch ? "⭐ Usulan" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 leading-normal bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>
                      Sistem mengusulkan penandatangan dari <strong>{log.plant || "Umum"}</strong> secara otomatis demi kesesuaian administrasi pabrik terkait.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Downloader Operations Buttons */}
            {currentSigner && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs py-3.5 px-4 rounded-xl border border-indigo-500/35 transition-all cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Unduh Microsoft Word (.doc)
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold text-xs py-3.5 px-4 rounded-xl border border-emerald-500/35 transition-all cursor-pointer shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF Resmi
                </button>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols) - Realistic document Live Preview */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold block">
              📄 Tampilan Pratinjau SPL Resmi (Kertas Kerja):
            </span>

            {/* Realistic paper content container */}
            <div className="border border-white/10 rounded-2xl bg-white p-6 shadow-inner text-slate-950 font-sans text-[9px] leading-tight select-none pointer-events-none transform origin-top overflow-y-auto max-h-[380px] custom-scroll">
              <div className="text-center font-bold text-[11px] tracking-tight text-black">SURAT PERINTAH LEMBUR (SPL)</div>
              <div className="text-center font-bold text-[9px] text-black">TENAGA KERJA BANTUAN</div>
              <div className="text-center font-bold text-[8px] border-b-2 border-black pb-2 mb-3 text-black">
                DEP. {depUpper}
              </div>

              <p className="mb-2">
                Kepada yang namanya tersebut dibawah ini, diperintahkan untuk bekerja lembur pada :
              </p>

              <table className="w-full mb-3 text-[8.5px]">
                <tbody>
                  <tr>
                    <td className="w-[12%] font-bold">Hari:</td>
                    <td className="w-[38%]">{dayName}</td>
                    <td className="w-[12%] font-bold">Tanggal:</td>
                    <td className="w-[38%]">{formattedDate}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Bagian:</td>
                    <td colSpan={3}>{settings.department}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-black text-[8px] text-left mb-5">
                <thead>
                  <tr className="bg-gray-100 font-bold">
                    <th className="border border-black p-1 text-center w-[6%]">No</th>
                    <th className="border border-black p-1 w-[32%]">Nama / Badge</th>
                    <th className="border border-black p-1 text-center w-[11%]">Mulai</th>
                    <th className="border border-black p-1 text-center w-[11%]">Selesai</th>
                    <th className="border border-black p-1 w-[40%]">Uraian Tugas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center font-bold">1</td>
                    <td className="border border-black p-1 font-bold">
                      {settings.employeeName.toUpperCase()}<br/>
                      <span className="font-mono text-gray-500 font-normal">Badge: {settings.employeeBadge}</span>
                    </td>
                    <td className="border border-black p-1 text-center font-mono">{log.startTime || "16:00"}</td>
                    <td className="border border-black p-1 text-center font-mono">{log.endTime || "18:00"}</td>
                    <td className="border border-black p-1 text-slate-800 break-words">{log.activity}</td>
                  </tr>
                  {/* Mock spacing rows */}
                  <tr>
                    <td className="border border-black p-1 text-center text-gray-300">2</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 text-center text-gray-300">3</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                    <td className="border border-black p-1">&nbsp;</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between text-[7px] text-gray-600">
                <div className="w-[50%] leading-relaxed">
                  <strong>Catatan :</strong><br/>
                  1. SPL dibuat rangkap 2, asli diserahkan ke Manager Inspeksi Teknik dsb.<br/>
                  2. Penyerahan SPL 1 minggu setelah pelaksanaan tugas.
                </div>
                <div className="w-[45%] text-center text-slate-900 text-[8.5px]">
                  Gresik, {formattedDate}<br/>
                  Yang memerintahkan,<br/>
                  <strong>{currentSigner ? currentSigner.position : "Smd I ITR Pabrik I"}</strong>
                  <br/><br/><br/>
                  <div className="underline font-bold text-black uppercase">
                    {currentSigner ? currentSigner.name : "Supervisor"}
                  </div>
                  Badge : {currentSigner ? currentSigner.badge : "000000"}
                </div>
              </div>
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
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
}
