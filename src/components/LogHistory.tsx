import React, { useState } from "react";
import { Search, Trash2, Calendar, Coffee, AlertCircle, Activity, Layers, Droplet, Gauge, Wrench, Factory, LayoutList, ChevronLeft, ChevronRight, X, Clock, HelpCircle, Package, FileText } from "lucide-react";
import { OvertimeLog, OvertimeSettings, Signer } from "../types";
import { getDayStatus } from "../utils/holidayHelper";
import SPLExportModal from "./SPLExportModal";

interface LogHistoryProps {
  logs: OvertimeLog[];
  onLogDelete: (id: string) => void;
  selectedDate: string;
  defaultMode?: "list" | "calendar";
  settings: OvertimeSettings;
  signers: Signer[];
}

export default function LogHistory({ logs, onLogDelete, selectedDate, defaultMode = "calendar", settings, signers }: LogHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [historyMode, setHistoryMode] = useState<"list" | "calendar">(defaultMode);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedPopupDate, setSelectedPopupDate] = useState<string | null>(null);
  const [selectedExportLog, setSelectedExportLog] = useState<OvertimeLog | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Map activities to responsive visual icons based on category
  const getActivityIcon = (log: OvertimeLog) => {
    const cat = (log.category || log.activity || "").toLowerCase();
    
    if (cat.includes("vibrasi") || cat.includes("vibration")) {
      return (
        <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl border border-indigo-500/20" title="Cek Vibrasi">
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
      );
    }
    if (cat.includes("material")) {
      return (
        <div className="p-2.5 bg-pink-500/15 text-pink-300 rounded-xl border border-pink-500/20" title="Cek Material">
          <Layers className="w-4 h-4 text-pink-400" />
        </div>
      );
    }
    if (cat.includes("penetrant") || cat.includes("pene")) {
      return (
        <div className="p-2.5 bg-cyan-500/15 text-cyan-300 rounded-xl border border-cyan-500/20" title="Penetrant Test">
          <Droplet className="w-4 h-4 text-cyan-400" />
        </div>
      );
    }
    if (cat.includes("pressure") || cat.includes("pres")) {
      return (
        <div className="p-2.5 bg-purple-500/15 text-purple-300 rounded-xl border border-purple-500/20" title="Pressure Test">
          <Gauge className="w-4 h-4 text-purple-400" />
        </div>
      );
    }
    if (cat.includes("karung") || cat.includes("uji karung")) {
      return (
        <div className="p-2.5 bg-amber-500/15 text-amber-300 rounded-xl border border-amber-500/20" title="Uji Karung">
          <Package className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    // Default fallback icon for Lainnya / general tasks
    return (
      <div className="p-2.5 bg-emerald-500/15 text-emerald-300 rounded-xl border border-emerald-500/20" title="Lainnya">
        <Wrench className="w-4 h-4 text-emerald-400" />
      </div>
    );
  };

  // Sort logs by Date descending
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter based on search query
  const filteredLogs = sortedLogs.filter((log) => {
    const textMatch = log.activity.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (log.category && log.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (log.plant && log.plant.toLowerCase().includes(searchQuery.toLowerCase()));
    return textMatch;
  });

  // Calendar Calculation Utilities
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const calTotalDays = getDaysInMonth(calYear, calMonth);
  const calFirstDayIndex = getFirstDayOfMonthIndex(calYear, calMonth);

  return (
    <div id="journal-history-panel" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

      {/* Header and Filter Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-md font-semibold text-slate-100 flex items-center gap-2">
            Catatan Harian Kerja Lembur Anda
          </h2>
          <p className="text-xs text-slate-400">Atur & lihat riwayat berdasarkan Aliran List atau interaktif melaui Mode Kalender.</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* SWITCH MODE TOGGLE */}
          <div className="flex backdrop-blur-md bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setHistoryMode("list")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                historyMode === "list"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-100 font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Mode List
            </button>
            <button
              onClick={() => setHistoryMode("calendar")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                historyMode === "calendar"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-100 font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Mode Kalender
            </button>
          </div>

          {/* Search input bar */}
          <div className="relative min-w-[200px] sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan/pabrik..."
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Main Container List rendering */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="p-3 bg-white/5 border border-white/15 text-slate-400 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300">
              {searchQuery ? "Tidak ditemukan catatan serupa" : "Belum ada catatan lembur terdaftar"}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              {searchQuery 
                ? "Cobalah mencari dengan kata kunci lain seperti nama Pabrik, kategori, atau deskripsi."
                : "Gunakan Tombol AI, Timer, atau klik kalender di atas untuk memformat data lembur Anda."}
            </p>
          </div>
        </div>
      ) : historyMode === "list" ? (
        /* MODE LIST: Timeline list stream */
        <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
          {filteredLogs.map((log) => {
            const isToday = log.date === todayStr;
            const logDate = new Date(log.date);

            return (
              <div key={log.id} className="relative group/item">
                {/* Timeline connector dot */}
                <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-all group-hover/item:scale-125 ${
                  isToday 
                    ? "bg-indigo-400 border-indigo-450 bg-indigo-400 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" 
                    : "bg-white/10 border-white/5"
                }`}></span>

                {/* Log Entry Card */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 items-start justify-between ${
                  log.date === selectedDate 
                    ? "bg-white/10 border-indigo-500/50" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}>
                  
                  {/* Left Column: Visual description & Activity content */}
                  <div className="flex gap-4.5 items-start flex-1 min-w-0">
                    <div className="shrink-0">{getActivityIcon(log)}</div>
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100 font-sans block truncate max-w-lg">
                          {log.activity}
                        </span>
                        {log.isTimerLog && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-md font-bold">
                            via Timer
                          </span>
                        )}
                        {log.plant && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/20 rounded-md flex items-center gap-1 font-semibold">
                            <Factory className="w-2.5 h-2.5 text-[#34d399]" />
                            {log.plant} • {log.subPlant}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {logDate.toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {log.startTime && ` • pukul ${log.startTime}${log.endTime ? ` - ${log.endTime}` : ""}`}
                      </p>

                      {log.notes && (
                        <p className="text-[11px] text-indigo-200 italic bg-white/5 px-2.5 py-1 rounded-lg inline-block mt-1 leading-normal border border-white/5">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Calculations & Controls */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-4 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div className="md:text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Total Lembur</span>
                      <span className="text-sm font-mono font-bold text-indigo-300">
                        +{log.durationHours} <span className="text-xs font-sans text-slate-400 font-normal">Jam</span>
                      </span>
                    </div>

                    <button
                      onClick={() => onLogDelete(log.id)}
                      className="text-slate-400 hover:text-pink-400 p-2 hover:bg-pink-500/10 rounded-xl transition-all cursor-pointer"
                      title="Hapus data lembur ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE KALENDER: Month visual layout with popups */
        <div className="space-y-5 animate-fade-in">
          {/* Month Switcher Banner */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4.5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/15 rounded-xl border border-indigo-500/25 text-indigo-300 shadow-inner">
                <Calendar className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-100 capitalize block tracking-tight">
                  {currentCalendarDate.toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Klik pada kotak hari untuk rincian lembur.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1))}
                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1))}
                className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Label Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, idx) => (
              <div
                key={idx}
                className={`text-[10px] font-bold uppercase tracking-wider py-1 font-mono select-none ${
                  idx === 0 ? "text-rose-400" : "text-slate-400"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Numbers */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset placeholders */}
            {Array.from({ length: calFirstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="aspect-square bg-transparent rounded-xl select-none" />
            ))}

            {/* Numeric month days */}
            {Array.from({ length: calTotalDays }, (_, i) => i + 1).map((day) => {
              const dayStr = `${calYear}-${(calMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const dayStatus = getDayStatus(dayStr);
              const isSunday = new Date(dayStr).getDay() === 0;
              const isRedDay = dayStatus.isHoliday || isSunday;

              // Filter logs for this specific date string in this loop
              const dayLogs = filteredLogs.filter((l) => l.date === dayStr);
              const totalHours = dayLogs.reduce((sum, item) => sum + item.durationHours, 0);
              const hasLogs = dayLogs.length > 0;
              const isToday = dayStr === todayStr;

              // Grid cell design depending on logs density
              let cellBackground = "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/15 text-slate-300";
              let textWeight = "text-slate-300";

              if (hasLogs) {
                textWeight = "text-white font-bold";
                if (totalHours <= 2) {
                  cellBackground = "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20";
                } else if (totalHours <= 4) {
                  cellBackground = "bg-indigo-500/20 border-indigo-500/50 text-indigo-100 hover:bg-indigo-500/30";
                } else {
                  cellBackground = "bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border-purple-500/40 text-slate-100 hover:from-indigo-500/40 hover:to-purple-500/40 shadow-sm";
                }
              }

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedPopupDate(dayStr)}
                  className={`aspect-square relative rounded-xl border flex flex-col justify-between p-2 select-none transition-all cursor-pointer group active:scale-95 ${cellBackground} ${
                    isToday ? "ring-2 ring-indigo-500/70" : ""
                  }`}
                  title={dayStatus.isHoliday ? `${dayStatus.name} (${dayStr})` : dayStr}
                >
                  {/* Top aligned line */}
                  <div className="w-full flex justify-between items-start">
                    <span className={`text-xs ml-0.5 leading-none transition-all ${
                      hasLogs 
                        ? "text-white font-bold" 
                        : isRedDay 
                          ? "text-rose-400 font-bold" 
                          : "text-slate-300"
                    }`}>
                      {day}
                    </span>
                    
                    {dayStatus.isHoliday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" title={dayStatus.name} />
                    )}
                  </div>

                  {/* Mid/Bottom block display */}
                  {hasLogs ? (
                    <div className="w-full text-right mt-auto pr-0.5 z-10">
                      <span className="text-[9px] font-mono leading-none font-black text-indigo-300 bg-indigo-500/20 px-1 py-0.5 rounded border border-indigo-500/10 inline-block">
                        +{totalHours}h
                      </span>
                    </div>
                  ) : isToday ? (
                    <span className="text-[8px] text-indigo-400 font-sans font-semibold mt-auto leading-none">Hari ini</span>
                  ) : null}

                  {/* Little category markers/dots near bottom-left */}
                  {hasLogs && (
                    <div className="flex gap-0.5 absolute bottom-1.5 left-1.5 pointer-events-none">
                      {dayLogs.slice(0, 3).map((item, keyIdx) => {
                        const cat = (item.category || item.activity || "").toLowerCase();
                        let dColor = "bg-emerald-400";
                        if (cat.includes("vibrasi")) dColor = "bg-indigo-400";
                        else if (cat.includes("material")) dColor = "bg-pink-400";
                        else if (cat.includes("penetrant")) dColor = "bg-cyan-400";
                        else if (cat.includes("pressure")) dColor = "bg-purple-400";
                        return (
                          <span key={keyIdx} className={`w-1 h-1 rounded-full ${dColor}`} />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* POP-UP MODAL: DETAILED DAILY OVERTIME LOG VIEWER */}
      {selectedPopupDate && (() => {
        const popupDayLogs = logs.filter((l) => l.date === selectedPopupDate);
        const dateObj = new Date(selectedPopupDate);
        const dayStatus = getDayStatus(selectedPopupDate);
        const totalHoursOnDate = popupDayLogs.reduce((sum, item) => sum + item.durationHours, 0);

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all antialiased animate-fade-in"
            onClick={() => setSelectedPopupDate(null)}
          >
            <div 
              className="relative bg-gradient-to-b from-slate-900 via-[#151c2c] to-slate-950 border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>

              {/* Close Button & Title Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl border border-indigo-500/25">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 font-sans">
                      Rincian Lembur
                    </h3>
                    <span className="text-[11px] text-slate-300 font-semibold block mt-1">
                      {dateObj.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </span>
                    {dayStatus.isHoliday ? (
                      <span className="text-[10px] text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md inline-block mt-1 font-semibold leading-none">
                        🎉 {dayStatus.name} (Libur Nasional)
                      </span>
                    ) : dayStatus.isWeekend ? (
                      <span className="text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md inline-block mt-1 font-semibold leading-none">
                        ⛺ Akhir Pekan (Lembur Hari Libur)
                      </span>
                    ) : null}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPopupDate(null)}
                  className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/5"
                  title="Tutup dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 relative z-10">
                {/* Total accumulation info box */}
                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">Total Akumulasi Kerja:</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-3 py-1 rounded-xl">
                    +{totalHoursOnDate} Jam Kerja
                  </span>
                </div>

                {popupDayLogs.length === 0 ? (
                  <div className="py-10 flex flex-col items-center text-center space-y-3 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl p-4">
                    <div className="p-2.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 font-sans">Belum ada catatan lembur</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                        Silakan tambah catatan lembur melalui form utama jika ingin mendaftarkan aktivitas lembur di tanggal ini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1">Daftar Kegiatan ({popupDayLogs.length}):</span>
                    
                    {popupDayLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 p-4 rounded-2xl flex flex-col gap-3 transition-all group/modal-item"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 items-start min-w-0">
                            <div className="shrink-0">{getActivityIcon(log)}</div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-100 break-words leading-tight">
                                  {log.activity}
                                </span>
                                {log.isTimerLog && (
                                  <span className="text-[8px] font-mono px-1.5 py-0.2 bg-indigo-500/25 text-indigo-300 rounded font-bold border border-indigo-500/20">
                                    Timer
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                                <span>Pukul {log.startTime || "16:00"}{log.endTime ? ` - ${log.endTime}` : ""}</span>
                                {log.plant && (
                                  <span className="text-[9px] font-sans px-1.5 py-0.2 bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/20 rounded flex items-center gap-0.5 font-medium leading-none">
                                    <Factory className="w-2.5 h-2.5 text-[#34d399]" />
                                    {log.plant} • {log.subPlant}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-indigo-300 block bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                              +{log.durationHours} Jam
                            </span>
                          </div>
                        </div>

                        {log.notes && (
                          <div className="text-[11px] text-indigo-200 italic bg-black/20 border border-white/5 px-3 py-2 rounded-xl leading-normal">
                            "{log.notes}"
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExportLog(log);
                            }}
                            className="text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 p-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold border border-indigo-500/20"
                            title="Unduh Surat Perintah Lembur Resmi (Word / PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            Unduh SPL
                          </button>

                          <button
                            onClick={() => {
                              onLogDelete(log.id);
                            }}
                            className="text-slate-400 hover:text-pink-400 p-1 hover:bg-pink-500/10 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                            title="Hapus kegiatan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-pink-400/85" />
                            Hapus Log
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPopupDate(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-xs font-bold text-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SPL Export Modal integration */}
      <SPLExportModal
        isOpen={selectedExportLog !== null}
        onClose={() => setSelectedExportLog(null)}
        log={selectedExportLog}
        settings={settings}
        signers={signers}
      />
    </div>
  );
}
