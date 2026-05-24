import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Check, Timer, Trash, Award } from "lucide-react";
import { OvertimeLog } from "../types";

interface ActiveTimerProps {
  onLogAdd: (log: Omit<OvertimeLog, "id" | "createdAt">) => void;
  onTimerRunningChange?: (running: boolean) => void;
}

import { PLANTS_DATA } from "./HeatmapCalendar";

const CATEGORIES = [
  "Cek Vibrasi",
  "Cek Material",
  "Penetrant Test",
  "Pressure Test",
  "Uji Karung",
  "Lainnya...."
];

export default function ActiveTimer({ onLogAdd, onTimerRunningChange }: ActiveTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [timerDate, setTimerDate] = useState("");
  
  // Ref to store original start time epoch to prevent phone standby freezing
  const startTimeRef = useRef<number | null>(null);
  
  // Modal for logging activity after stopping
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveDuration, setSaveDuration] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("Cek Vibrasi");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [selectedPlant, setSelectedPlant] = useState<string>("Pabrik I");
  const [selectedSubPlant, setSelectedSubPlant] = useState<string>("A.1. NH3 A");
  const [notesInput, setNotesInput] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load active timer from localStorage if page refreshed
  useEffect(() => {
    const savedTimer = localStorage.getItem("active_overtime_timer");
    if (savedTimer) {
      const { start, date } = JSON.parse(savedTimer);
      // calculate elapsed time including offline period
      const startTimeMs = new Date(start).getTime();
      startTimeRef.current = startTimeMs;
      
      const nowMs = new Date().getTime();
      const actualElapsed = Math.floor((nowMs - startTimeMs) / 1000);
      
      setStartTimeStr(new Date(start).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      setTimerDate(date);
      setElapsedSeconds(actualElapsed > 0 ? actualElapsed : 0);
      setIsRunning(true);
      onTimerRunningChange?.(true);
    }
  }, [onTimerRunningChange]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const nowMs = Date.now();
          const actualElapsed = Math.floor((nowMs - startTimeRef.current) / 1000);
          setElapsedSeconds(actualElapsed > 0 ? actualElapsed : 0);
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    startTimeRef.current = now.getTime();

    // Save state to store across refreshes
    localStorage.setItem(
      "active_overtime_timer",
      JSON.stringify({
        start: now.toISOString(),
        date: currentDateStr,
        elapsed: 0,
      })
    );

    setStartTimeStr(timeStr);
    setTimerDate(currentDateStr);
    setElapsedSeconds(0);
    setIsRunning(true);
    onTimerRunningChange?.(true);
    setError(null);
  };

  const [error, setError] = useState<string | null>(null);

  const handleStop = () => {
    if (elapsedSeconds < 10) {
      // Don't allow logging less than 10 seconds of mock overtime to prevent accidental clicks
      setError("Durasi lembur terlalu pendek untuk dicatat (minimal 10 detik).");
      handleReset();
      return;
    }

    setIsRunning(false);
    onTimerRunningChange?.(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    localStorage.removeItem("active_overtime_timer");
    
    // Suggest rounding up but let users edit it
    const mathHours = Math.max(1, Math.ceil(elapsedSeconds / 3600));
    setSaveDuration(mathHours);
    setShowSaveForm(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    onTimerRunningChange?.(false);
    startTimeRef.current = null;
    setElapsedSeconds(0);
    setStartTimeStr("");
    setTimerDate("");
    localStorage.removeItem("active_overtime_timer");
    setError(null);
  };

  const handlePlantChange = (plantName: string) => {
    setSelectedPlant(plantName);
    const subList = PLANTS_DATA[plantName];
    if (subList && subList.length > 0) {
      setSelectedSubPlant(subList[0]);
    }
  };

  const handleSaveSubmit = () => {
    const categoryText = selectedCategory === "Lainnya...." 
      ? (customCategory.trim() || "Lainnya") 
      : selectedCategory;
      
    const finalActivity = `${categoryText} [${selectedPlant} - ${selectedSubPlant}]`;

    const stopTime = new Date();
    const endTimeStr = stopTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    
    const durationHours = saveDuration;

    onLogAdd({
      date: timerDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationHours: durationHours,
      activity: finalActivity,
      category: categoryText,
      plant: selectedPlant,
      subPlant: selectedSubPlant,
      notes: notesInput.trim() || undefined,
      isTimerLog: true,
    });

    // Reset Form state
    setShowSaveForm(false);
    setSelectedCategory("Cek Vibrasi");
    setCustomCategory("");
    setNotesInput("");
    setElapsedSeconds(0);
    setStartTimeStr("");
    setTimerDate("");
  };

  // Convert seconds to readable format (HH:MM:SS)
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  return (
    <div id="live-timer-widget" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl">
            <Timer className="w-5 h-5 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h2 className="text-md font-semibold text-slate-100 flex items-center gap-2">
              Tombol Timer Instant
            </h2>
            <p className="text-xs text-slate-400">Tekan 'Mulai' saat lembur, tekan 'Selesai' saat pulang.</p>
          </div>
        </div>
      </div>

      {/* Main Clock UI */}
      {!showSaveForm ? (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-2 ${
            isRunning 
              ? "bg-white/5 border-indigo-500 pulsing-glow text-indigo-300" 
              : "bg-white/5 border-white/10 text-slate-400"
          }`}>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              {isRunning ? "Lembur Berjalan" : "Timer Siaga"}
            </span>
            <span className="text-2xl font-mono font-bold tracking-tight mt-1">
              {formatTime(elapsedSeconds)}
            </span>
            {isRunning && (
              <span className="text-[10px] text-indigo-300 font-mono mt-1">
                Mulai: {startTimeStr}
              </span>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-red-400 max-w-[240px] text-center whitespace-normal">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 w-full max-w-[260px] pt-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                Mulai Lembur
              </button>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="p-3 bg-white/5 border border-white/10 hover:bg-white/15 text-red-400 rounded-xl transition-all cursor-pointer"
                  title="Batalkan Sesi"
                >
                  <Trash className="w-4 h-4" />
                </button>
                <button
                  onClick={handleStop}
                  className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-red-500/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Selesai Lembur
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Save Form modal layout inside the container to prevent distraction */
        <div className="py-2 space-y-4 animate-fade-in text-sans">
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex gap-3 items-center">
              <Award className="w-8 h-8 text-indigo-300 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-indigo-300 font-mono uppercase font-bold block">Kerja Keras Selesai! ⚡</span>
                <p className="text-xs text-slate-300 leading-tight">
                  Durasi real: <strong className="text-white font-mono">{parseFloat((elapsedSeconds / 3600).toFixed(2))} jam</strong>
                </p>
              </div>
            </div>
            
            <div className="sm:ml-auto border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans block mb-1">Durasi Simpan (Jam):</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSaveDuration((d) => Math.max(1, d - 1))}
                  className="px-2 py-1 bg-white/5 border border-white/15 text-xs rounded-lg font-bold hover:bg-white/10 text-slate-200 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={saveDuration}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setSaveDuration(isNaN(parsed) ? 1 : parsed);
                  }}
                  className="w-14 text-center bg-slate-900 border border-white/15 focus:border-indigo-500 rounded px-1.5 py-0.5 text-xs text-indigo-300 font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => setSaveDuration((d) => d + 1)}
                  className="px-2 py-1 bg-white/5 border border-white/15 text-xs rounded-lg font-bold hover:bg-white/10 text-slate-200 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 1. Category Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">1. Kategori Kegiatan:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] text-left px-2.5 py-1.5 rounded-xl border transition-all whitespace-normal break-words leading-tight flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-semibold"
                      : "bg-white/5 border-white/5 text-slate-300 hover:text-white hover:border-white/10"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    cat === "Cek Vibrasi" ? "bg-indigo-400" :
                    cat === "Cek Material" ? "bg-pink-400" :
                    cat === "Penetrant Test" ? "bg-cyan-400" :
                    cat === "Pressure Test" ? "bg-purple-400" : "bg-slate-400"
                  }`}></span>
                  {cat}
                </button>
              ))}
            </div>
            {selectedCategory === "Lainnya...." && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Tulis kegiatan lembur kustom di sini..."
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
                />
              </div>
            )}
          </div>

          {/* 2. Plant / Sub-plant selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">2. Pilih Plant:</span>
              <div className="grid grid-cols-3 gap-1">
                {Object.keys(PLANTS_DATA).map((plantName) => (
                  <button
                    key={plantName}
                    type="button"
                    onClick={() => handlePlantChange(plantName)}
                    className={`text-[10px] py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      selectedPlant === plantName
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-bold"
                        : "bg-white/5 border-white/5 text-slate-300 hover:text-white"
                    }`}
                  >
                    {plantName}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">3. Pilih Sub-Plant:</span>
              <select
                value={selectedSubPlant}
                onChange={(e) => setSelectedSubPlant(e.target.value)}
                className="w-full bg-[#1e293b] text-slate-200 text-xs rounded-xl border border-white/10 px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-sans"
              >
                {PLANTS_DATA[selectedPlant]?.map((sub) => (
                  <option key={sub} value={sub} className="bg-[#0f172a] text-slate-200">
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Notes Additional info */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">4. Catatan / Deskripsi Keterangan Extra (Opsional):</label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Misal: Selesai kalibrasi instrumen..."
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => {
                setShowSaveForm(false);
                handleReset();
              }}
              className="text-[11px] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
            >
              Hapus Sesi
            </button>
            <button
              onClick={handleSaveSubmit}
              className="text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all cursor-pointer font-sans"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Catatan Lembur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
