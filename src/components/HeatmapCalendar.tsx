import React, { useState, useEffect } from "react";
import { Calendar, Plus, Award, ChevronLeft, ChevronRight, Check, Clock, Sparkles, FileText } from "lucide-react";
import { OvertimeLog, OvertimeSettings, Signer } from "../types";
import { getDayStatus, getSuggestedStartTime } from "../utils/holidayHelper";
import SPLExportModal from "./SPLExportModal";

interface HeatmapCalendarProps {
  logs: OvertimeLog[];
  onLogAdd: (log: Omit<OvertimeLog, "id" | "createdAt">) => void;
  onSelectDay: (dateStr: string) => void;
  selectedDate: string;
  showGridOnly?: boolean;
  showFormOnly?: boolean;
  onCloseForm?: () => void;
  settings: OvertimeSettings;
  signers: Signer[];
}

export const PLANTS_DATA: Record<string, string[]> = {
  "Pabrik I": [
    "A.1. NH3 A",
    "A.2. UREA A",
    "A.3. UTILITAS A",
    "A.4. ZA I/III",
    "A.5. NH3B",
    "A.6. UREA B",
    "A.7. UTILITAS B",
    "A.8. WORKSHOP I"
  ],
  "Pabrik II": [
    "B.1. PHONSKA I",
    "B.2. PHONSKA II",
    "B.3. PHONSKA III",
    "B.4. PHONSKA IV",
    "B.5. PHONSKA V",
    "B.6. NPK I",
    "B.7. NPK II",
    "B.8. NPK III",
    "B.9. NPK IV",
    "B.10. UTILITAS II",
    "B.11. ZK",
    "B.12. WORKSHOP II",
    "B.13. FABRIKASI"
  ],
  "Pabrik III": [
    "C.1. PA3 A",
    "C.2. SA3 A",
    "C.3. ALF",
    "C.4. UBB",
    "C.5. PA3 B",
    "C.6. SA3 B",
    "C.7. UTILITAS III",
    "C.8. ZA II",
    "C.9. WORKSHOP III"
  ]
};

const CATEGORIES = [
  "Cek Vibrasi",
  "Cek Material",
  "Penetrant Test",
  "Pressure Test",
  "Uji Karung",
  "Lainnya...."
];

const PRESET_HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function HeatmapCalendar({ 
  logs, 
  onLogAdd, 
  onSelectDay, 
  selectedDate,
  showGridOnly = false,
  showFormOnly = false,
  onCloseForm,
  settings,
  signers
}: HeatmapCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); // Dynamic current date for current running month default
  const [quickHours, setQuickHours] = useState<number>(2); // 1 to 12 whole hours
  const [selectedCategory, setSelectedCategory] = useState<string>("Cek Vibrasi");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [selectedPlant, setSelectedPlant] = useState<string>("Pabrik I");
  const [selectedSubPlant, setSelectedSubPlant] = useState<string>("A.1. NH3 A");
  const [notes, setNotes] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [startTime, setStartTime] = useState<string>("16:00");
  const [selectedExportLog, setSelectedExportLog] = useState<OvertimeLog | null>(null);

  // Automatically adapt default start times when clicked date changes
  useEffect(() => {
    if (selectedDate) {
      const suggest = getSuggestedStartTime(selectedDate);
      setStartTime(suggest.startTime);
      
      const parsedDate = new Date(selectedDate);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
      }
    }
  }, [selectedDate]);

  // Helper dates
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (y: number, m: number) => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(y, m, 1).getDay();
  };

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonthIndex(year, month);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Get total overtime hours logged for a specific date (YYYY-MM-DD)
  const getLogsForDate = (dateStr: string) => {
    return logs.filter((log) => log.date === dateStr);
  };

  const getHoursForDate = (dateStr: string) => {
    const dayLogs = getLogsForDate(dateStr);
    return dayLogs.reduce((sum, item) => sum + item.durationHours, 0);
  };

  // Determine heatmap coloration based on overtime hours logged
  const getHeatmapClass = (hours: number, dateStr: string) => {
    const isSelected = selectedDate === dateStr;
    const baseBorder = isSelected 
      ? "border-indigo-400 shadow-md ring-1 ring-indigo-400 scale-[1.08] z-10" 
      : "border-white/5 hover:border-white/20";

    if (hours === 0) {
      return `bg-white/5 text-slate-500 hover:bg-white/10 ${baseBorder}`;
    }
    if (hours <= 2) {
      return `bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold ${baseBorder}`;
    }
    if (hours <= 4) {
      return `bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 font-bold ${baseBorder}`;
    }
    return `bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20 ${baseBorder}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCellClick = (dayStr: string) => {
    onSelectDay(dayStr);
    setSaveSuccess(false);
  };

  const handlePlantChange = (plantName: string) => {
    setSelectedPlant(plantName);
    const subList = PLANTS_DATA[plantName];
    if (subList && subList.length > 0) {
      setSelectedSubPlant(subList[0]);
    }
  };

  const calculateEndTime = (start: string, duration: number) => {
    if (!start) return { endTime: "--:--", crossesMidnight: false };
    const parts = start.replace(".", ":").split(":");
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || hours < 0 || hours >= 24) hours = 16;
    if (isNaN(minutes) || minutes < 0 || minutes >= 60) minutes = 0;

    const startTotalInMinutes = hours * 60 + minutes;
    const durationInMinutes = Math.round(duration * 60);
    const endTotalInMinutes = startTotalInMinutes + durationInMinutes;

    const endHours = Math.floor(endTotalInMinutes / 60) % 24;
    const endMinutes = endTotalInMinutes % 60;
    const crossesMidnight = endTotalInMinutes >= 24 * 60;

    const formattedHours = endHours.toString().padStart(2, "0");
    const formattedMinutes = endMinutes.toString().padStart(2, "0");

    return {
      endTime: `${formattedHours}:${formattedMinutes}`,
      crossesMidnight
    };
  };

  const handleQuickAdd = () => {
    if (!quickHours) return;
    
    const categoryText = selectedCategory === "Lainnya...." 
      ? (customCategory.trim() || "Lainnya") 
      : selectedCategory;
      
    // Create activity text that summarizes Category + Plant details
    const finalActivity = `${categoryText} [${selectedPlant} - ${selectedSubPlant}]`;
    const { endTime } = calculateEndTime(startTime || "16:00", quickHours);

    onLogAdd({
      date: selectedDate,
      startTime: startTime || "16:00", // Dynamically detected / adjusted
      endTime: endTime, // Let it calculate later or remain blank
      durationHours: quickHours,
      activity: finalActivity,
      category: categoryText,
      plant: selectedPlant,
      subPlant: selectedSubPlant,
      notes: notes.trim() || undefined,
    });

    setSaveSuccess(true);
    // Reset inputs for convenience but keep plant settings
    setNotes("");
    setCustomCategory("");
    setTimeout(() => {
      setSaveSuccess(false);
      onCloseForm?.();
    }, 1200);
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const weekdayInitials = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const renderCalendarGrid = () => {
    return (
      <div className="flex flex-col justify-between space-y-4 w-full">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-indigo-500/15 text-indigo-300 rounded-xl">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-md font-semibold text-slate-100 flex items-center gap-2">
                  Kalender Kerja Lembur
                </h2>
                <p className="text-xs text-slate-400">Pilih tanggal untuk menambah atau melihat rincian.</p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 px-2 hover:bg-white/10 hover:text-indigo-300 text-slate-400 rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-300 font-sans min-w-[90px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 px-2 hover:bg-white/10 hover:text-indigo-300 text-slate-400 rounded-lg transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Heatmap Calendar Matrix */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {/* Weekday labels */}
            {weekdayInitials.map((day, idx) => (
              <div 
                key={idx} 
                className={`text-center text-[10px] uppercase tracking-wider font-semibold font-mono py-1 ${
                  idx === 0 ? "text-rose-400 font-bold" : "text-slate-400"
                }`}
              >
                {day}
              </div>
            ))}

            {/* Empty offset items for first week */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-lg border border-transparent"></div>
            ))}

            {/* Day grid items */}
            {daysArray.map((day) => {
              const dayStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const hrsLogged = getHoursForDate(dayStr);
              
              const dayStatus = getDayStatus(dayStr);
              const isSunday = new Date(dayStr).getDay() === 0;
              const isRedDay = dayStatus.isHoliday || isSunday;

              // Title string for tooltip
              const tooltipTitle = dayStatus.isHoliday 
                ? `${dayStr}: ${dayStatus.name} (Tanggal Merah) - ${hrsLogged} jam lembur` 
                : `${dayStr}: ${hrsLogged} jam lembur`;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleCellClick(dayStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer font-mono text-xs transition-all ${getHeatmapClass(
                    hrsLogged,
                    dayStr
                  )}`}
                  title={tooltipTitle}
                >
                  <span className={
                    hrsLogged > 0 
                      ? "font-bold text-white shadow-sm" 
                      : isRedDay 
                        ? "text-rose-400 font-semibold" 
                        : "text-slate-300"
                  }>
                    {day}
                  </span>
                  
                  {/* Glowing micro status bar if hours exist */}
                  {hrsLogged > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full absolute bottom-1 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                  ) : dayStatus.isHoliday ? (
                    // Subtle red dot indicator for holidays on weekday
                    <span className="w-1 h-1 rounded-full absolute bottom-1 bg-rose-500/80"></span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-sans pt-3 border-t border-white/5">
          <span className="font-medium text-slate-400">Kepadatan Jam Lembur:</span>
          <div className="flex items-center gap-1.5">
            <span>0 Jam</span>
            <div className="w-3.5 h-3.5 rounded bg-white/5 border border-white/5"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-500/10 border border-indigo-500/30"></div>
            <div className="w-3.5 h-3.5 rounded bg-indigo-500/20 border border-indigo-500/50"></div>
            <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
            <span>4+ Jam</span>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => {
    return (
      <div className="flex flex-col space-y-4 w-full">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg border border-indigo-500/25 uppercase">
              Formulir Input Cepat
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Mode Aktif
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-950/60 to-transparent p-3 rounded-2xl border border-indigo-500/15">
            <span className="text-[9px] text-indigo-300 font-bold block mb-1 font-mono uppercase tracking-wider">Tanggal Kerja Terpilih</span>
            <div className="text-sm font-semibold text-slate-100 font-sans tracking-tight">
              {new Date(selectedDate).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Silakan pilih hari pada kalender, kemudian tentukan kegiatan, departemen plant, jam mulai, serta durasi di bawah:
          </p>
        </div>
 
        {/* 1. Kategori Kegiatan */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">1. Kategori Kegiatan:</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] text-left px-3 py-2 rounded-xl border transition-all whitespace-normal break-words leading-tight flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 font-bold shadow-md shadow-indigo-950/50"
                    : "bg-white/5 border-white/5 text-slate-300 hover:text-white hover:border-white/10 hover:bg-white/10"
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
            <div className="pt-1 animate-fade-in">
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Tulis kegiatan lembur kustom di sini..."
                className="w-full bg-slate-900/40 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans shadow-inner"
              />
            </div>
          )}
        </div>
 
        {/* 2. Plant / Sub-plant selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">2. Lokasi Plant:</span>
            <div className="grid grid-cols-3 gap-1">
              {Object.keys(PLANTS_DATA).map((plantName) => (
                <button
                  key={plantName}
                  type="button"
                  onClick={() => handlePlantChange(plantName)}
                  className={`text-[10px] py-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedPlant === plantName
                      ? "bg-indigo-500/25 border-indigo-500/50 text-indigo-200 font-black shadow-md shadow-indigo-950/50"
                      : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {plantName}
                </button>
              ))}
            </div>
          </div>
 
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">3. Sub-Plant Unit:</span>
            <select
              value={selectedSubPlant}
              onChange={(e) => setSelectedSubPlant(e.target.value)}
              className="w-full bg-slate-900 text-slate-200 text-xs rounded-xl border border-white/10 px-3 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-sans shadow-inner"
            >
              {PLANTS_DATA[selectedPlant]?.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-950 text-slate-200 py-1">
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
 
        {/* Smart Start-Time Suggestion Block */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">4. Jam Mulai Lembur:</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono tracking-tight flex items-center gap-1.5 transition-all select-none ${
              getSuggestedStartTime(selectedDate).isHolidayOrWeekend 
                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-md" 
                : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-md"
            }`}>
              {getSuggestedStartTime(selectedDate).isHolidayOrWeekend ? "🎉" : "⚡"} {getSuggestedStartTime(selectedDate).reason}
            </span>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400">
                <Clock className="w-4 h-4 text-indigo-400" />
              </span>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="Misal 16:00 atau 07:00"
                className="w-full bg-slate-900/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl pr-3 pl-10 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans shadow-inner"
              />
            </div>
            
            {/* Quick preset switch buttons for convenience */}
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => setStartTime("07:00")}
                className={`px-3 py-2 text-[10px] font-mono rounded-xl border transition-all cursor-pointer ${
                  startTime === "07:00"
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold shadow-md shadow-rose-950/20"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                07:00
              </button>
              <button
                type="button"
                onClick={() => setStartTime("16:00")}
                className={`px-3 py-2 text-[10px] font-mono rounded-xl border transition-all cursor-pointer ${
                  startTime === "16:00"
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-bold shadow-md shadow-indigo-950/20"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                16:00
              </button>
            </div>
          </div>
        </div>
 
        {/* 5. Duration rounded picker & Live time block */}
        <div className="space-y-2.5 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">5. Pilih Durasi Lembur:</span>
            <span className="bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/25 font-mono font-bold leading-none text-[10px]">
              {quickHours} Jam Kerja
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1">
            {PRESET_HOURS.map((hr) => (
              <button
                key={hr}
                type="button"
                onClick={() => setQuickHours(hr)}
                className={`text-[11px] font-mono py-1.5 rounded-lg border transition-all cursor-pointer ${
                  quickHours === hr
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-950/40"
                    : "bg-white/5 border-white/1 text-slate-300 hover:text-indigo-400 hover:bg-white/10"
                }`}
              >
                {hr} Jam
              </button>
            ))}
          </div>

          {/* Custom Duration Input for > 12 hours */}
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1.5 animate-fade-in">
            <label className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              🔋 Atau Masukkan Durasi Kustom:
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-[130px]">
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={quickHours}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setQuickHours(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-slate-900 border border-white/10 focus:border-indigo-500/50 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all text-center font-bold"
                />
                <span className="absolute right-3 top-1.5 text-[10px] text-slate-400 font-mono">Jam</span>
              </div>
              
              <div className="flex gap-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuickHours((prev) => Math.max(0.5, prev - 1))}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] rounded-lg font-bold cursor-pointer"
                >
                  -1 Jam
                </button>
                <button
                  type="button"
                  onClick={() => setQuickHours((prev) => prev + 1)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] rounded-lg font-bold cursor-pointer"
                >
                  +1 Jam
                </button>
                <button
                  type="button"
                  onClick={() => setQuickHours(12)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] rounded-lg font-mono cursor-pointer"
                >
                  Reset 12
                </button>
              </div>
            </div>
          </div>

          {/* Time range preview display card */}
          {startTime && (
            (() => {
              const { endTime, crossesMidnight } = calculateEndTime(startTime, quickHours);
              return (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 animate-fade-in shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none"></div>
                  
                  <div className="space-y-1.5 relative z-10 flex-1">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest block font-mono">
                      HASIL PERHITUNGAN RENTANG JAM
                    </span>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-white/5 shadow-sm">
                        <span className="text-[9px] text-slate-450 text-slate-400 uppercase font-mono mr-1 font-bold">MULAI</span>
                        <span className="text-xs font-bold font-mono text-indigo-300">{startTime}</span>
                      </div>
                      
                      <span className="text-slate-400 font-bold font-sans px-0.5">➔</span>
                      
                      <div className="flex items-center gap-1.5 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm font-bold">
                        <span className="text-[9px] text-slate-450 text-slate-400 uppercase font-mono mr-1">SELESAI</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">{endTime}</span>
                      </div>

                      {crossesMidnight && (
                        <span className="text-[8px] font-sans text-rose-300 font-semibold bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 tracking-tight leading-none">
                          +1 Hari (Besok)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 relative z-10 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 flex flex-row md:flex-col justify-between md:justify-center">
                    <span className="text-[9px] text-slate-400 block uppercase font-mono leading-none tracking-normal">DURASI BULAT</span>
                    <span className="text-md md:text-lg font-black font-mono text-indigo-300 md:mt-1 block leading-none">
                      {quickHours} JAM
                    </span>
                  </div>
                </div>
              );
            })()
          )}
        </div>
 
        {/* 6. Column notes additional */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">6. Catatan / Deskripsi Tambahan:</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Keterangan tambahan jika diperlukan..."
            className="w-full bg-slate-900/40 border border-white/10 focus:border-indigo-500/50 hover:border-white/20 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans shadow-inner"
          />
        </div>
 
        {/* Helper informational text explaining the button's action */}
        <div className="bg-slate-900/50 leading-relaxed p-3 rounded-2xl text-[10px] text-slate-400 border border-white/5 space-y-1 shadow-inner">
          <p className="font-semibold text-indigo-300 flex items-center gap-1">
            💡 Mengapa Perlu Menyimpan?
          </p>
          <p>
            Menyimpan akan mendaftarkan rincian lembur seperti <b>{selectedCategory === "Lainnya...." ? (customCategory || "Kustom") : selectedCategory}</b> di <b>{selectedPlant} ({selectedSubPlant})</b> ke kalender history bulanan Anda.
          </p>
        </div>
 
        {saveSuccess ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-1.5 justify-center animate-fade-in font-semibold">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            Catatan Lembur Berhasil Disimpan ke Kalender! 👍
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!quickHours}
            className="w-full bg-gradient-to-r from-indigo-650 to-purple-650 bg-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 text-xs font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985]"
          >
            <Plus className="w-4 h-4 shrink-0 text-white" />
            Simpan Catatan Lembur Hari Ini
          </button>
        )}

        {/* Existing logs on this date for download SPL */}
        {(() => {
          const dayLogs = logs.filter((l) => l.date === selectedDate);
          if (dayLogs.length === 0) return null;
          return (
            <div className="space-y-2 pt-3 border-t border-white/10 text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">
                📋 Catatan Lembur Tanggal Ini ({dayLogs.length}):
              </span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scroll pr-1">
                {dayLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-2xl flex flex-col gap-2 transition-all">
                    <div className="flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-200 block truncate">{log.activity}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Pukul {log.startTime || "16:00"}{log.endTime ? ` - ${log.endTime}` : ""} ({log.durationHours} Jam)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedExportLog(log)}
                        className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Unduh SPL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  if (showFormOnly) {
    return (
      <>
        {renderForm()}
        <SPLExportModal
          isOpen={selectedExportLog !== null}
          onClose={() => setSelectedExportLog(null)}
          log={selectedExportLog}
          settings={settings}
          signers={signers}
        />
      </>
    );
  }

  if (showGridOnly) {
    return (
      <div id="calendar-heatmap-card" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden w-full">
        {renderCalendarGrid()}
      </div>
    );
  }

  return (
    <>
      <div id="calendar-heatmap-card" className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Heatmap visualization Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {renderCalendarGrid()}
        </div>

        {/* Quick Add Form on Selected Cell */}
        <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5 shadow-2xl relative">
          {renderForm()}
        </div>
      </div>

      <SPLExportModal
        isOpen={selectedExportLog !== null}
        onClose={() => setSelectedExportLog(null)}
        log={selectedExportLog}
        settings={settings}
        signers={signers}
      />
    </>
  );
}
