import React, { useState, useRef } from "react";
import { Sparkles, Loader2, Check, CornerDownRight, AlertCircle, Info, Mic, MicOff } from "lucide-react";
import { OvertimeLog } from "../types";

interface AIParsingBoxProps {
  onLogAdd: (log: Omit<OvertimeLog, "id" | "createdAt">) => void;
}

const SAMPLE_COMMANDS = [
  "Tadi malam lembur 2.5 jam ngerapiin database",
  "Kemarin lanjut lembur jam 18:00 - 20:45 buat rapat divisi",
  "Jumat lalu lembur 4 jam kelarin bug deploy production",
  "Hari ini lembur 1 jam benerin design feedback",
];

export default function AIParsingBox({ onLogAdd }: AIParsingBoxProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedDraft, setParsedDraft] = useState<Omit<OvertimeLog, "id" | "createdAt"> & { explanation?: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Speech Recognition hook-up
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);

  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognitionAPI;

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "id-ID";

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev.trim() + " " + transcript : transcript));
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event);
          setIsListening(false);
          if (event.error === "not-allowed") {
            setError("Gagal mengakses mikrofon. Pastikan Anda mengizinkan izin akses mic di browser.");
          } else {
            setError(`Error input suara: ${event.error || "Kesalahan tidak dikenal"}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Speech recognition initialization failed:", err);
        setError("Browser tidak mendukung atau tidak berhasil memulai input suara.");
        setIsListening(false);
      }
    }
  };

  const handleAiParse = async (textToParse: string) => {
    if (!textToParse.trim()) return;

    setLoading(true);
    setError(null);
    setParsedDraft(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/parse-overtime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToParse,
          clientTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menghubungi server AI");
      }

      const data = await response.json();
      
      if (data && (data.durationHours > 0 || data.activity)) {
        setParsedDraft({
          date: data.date || new Date().toISOString().split("T")[0],
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          durationHours: data.durationHours || 1,
          activity: data.activity || "Kerja Lembur",
          notes: data.explanation || "",
        });
      } else {
        setError(
          data.explanation || 
          "AI kurang yakin mendeteksi durasi atau kegiatan. Silakan perjelas kalimat Anda (misal sertakan jumlah jam lembur)."
        );
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan jaringan atau server AI. Silakan coba pengisian manual di bawah.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDraftAndSave = () => {
    if (!parsedDraft) return;

    onLogAdd({
      date: parsedDraft.date,
      startTime: parsedDraft.startTime,
      endTime: parsedDraft.endTime,
      durationHours: parsedDraft.durationHours,
      activity: parsedDraft.activity,
      notes: parsedDraft.notes,
    });

    setParsedDraft(null);
    setInputText("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="ai-entry-box" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-md font-semibold text-slate-100 flex items-center gap-2">
            Pencatatan Cepat via AI
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/20 uppercase tracking-wider font-bold">Tercepat</span>
          </h2>
          <p className="text-xs text-slate-400">Tulis bebas seperti di note HP, AI kami akan memformat otomatis.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Contoh: 'kemarin lembur 2.5 jam kelarin laporan bulanan divisi finance' atau 'hari jumat jam 18:00 sampai 20:00 rapat koordinasi release'"
            className="w-full h-28 bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-sans"
            disabled={loading}
          />
          
          {/* Floating Microphone Dictation Trigger */}
          {speechSupported ? (
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-3.5 bottom-3.5 p-2.5 rounded-xl border transition-all cursor-pointer shadow-lg flex items-center justify-center ${
                isListening
                  ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse scale-105"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/10 active:scale-95"
              }`}
              title={isListening ? "Sedang mendengarkan... Ambil suara Anda lalu klik lagi untuk berhenti" : "Input bebas pakai suara (Bebas Biaya)"}
            >
              {isListening ? (
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <MicOff className="w-4 h-4 text-red-400" />
                </div>
              ) : (
                <Mic className="w-4 h-4 transition-transform hover:scale-110" />
              )}
            </button>
          ) : (
            <div 
              className="absolute right-3.5 bottom-3.5 p-2 text-slate-600 cursor-not-allowed"
              title="Browser Anda belum mendukung Speech Recognition"
            >
              <Mic className="w-4 h-4 opacity-30" />
            </div>
          )}

          {/* Active Listening Overlay Indicator */}
          {isListening && (
            <div className="absolute top-3 right-4 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] font-mono font-bold text-red-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              BICARA SEKARANG (BAHASA INDONESIA)
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5 max-w-lg">
            <span className="text-[11px] text-slate-405 mr-1 flex items-center gap-0.5">
              <CornerDownRight className="w-3 h-3 text-indigo-400" /> Rekomendasi coba:
            </span>
            {SAMPLE_COMMANDS.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(cmd)}
                className="text-[11px] bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 hover:border-white/10 transition-all font-sans cursor-pointer"
                disabled={loading}
              >
                {cmd.substring(0, 32)}...
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAiParse(inputText)}
            disabled={loading || !inputText.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-slate-500 text-white shadow-lg shadow-indigo-500/20 text-xs font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap self-end sm:self-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Format Instan
              </>
            )}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Catatan lembur berhasil dianalisis AI dan disimpan ke kalender Anda! 👍</span>
          </div>
        )}

        {/* Parsed Draft Result Card */}
        {parsedDraft && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/10 uppercase tracking-widest font-semibold">
                  Saran Draft AI
                </span>
                <p className="text-xs text-slate-400 mt-1">Konfirmasi rincian sebelum disimpan:</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Durasi:</span>
                <p className="text-lg font-mono font-bold text-indigo-300">
                  {parsedDraft.durationHours} <span className="text-xs font-sans text-slate-400">Jam</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-slate-400 block">Tanggal</span>
                <span className="text-xs font-mono font-medium text-slate-200">
                  {new Date(parsedDraft.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Jam Mulai</span>
                <span className="text-xs font-mono text-slate-200">
                  {parsedDraft.startTime || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Jam Selesai</span>
                <span className="text-xs font-mono text-slate-200">
                  {parsedDraft.endTime || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Kategori Kegiatan</span>
                <span className="text-xs font-sans text-slate-200 truncate block">
                  {parsedDraft.activity}
                </span>
              </div>
            </div>

            {parsedDraft.notes && (
              <div className="flex items-start gap-1 text-[11px] text-indigo-250 bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                <span><strong className="text-indigo-300">Keterangan AI:</strong> {parsedDraft.notes}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setParsedDraft(null)}
                className="text-[11px] font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10"
              >
                Batal
              </button>
              <button
                onClick={confirmDraftAndSave}
                className="text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Simpan Ke Data Lembur
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
