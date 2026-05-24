import React, { useState } from "react";
import { TrendingUp, Banknote, Target, Hourglass, Clock, Sparkles, Calendar } from "lucide-react";
import { OvertimeLog, OvertimeSettings } from "../types";
import { getDayStatus } from "../utils/holidayHelper";

interface OvertimeAnalyticsProps {
  logs: OvertimeLog[];
  settings: OvertimeSettings;
  onSettingsChange: (settings: OvertimeSettings) => void;
}

export default function OvertimeAnalytics({ logs, settings, onSettingsChange }: OvertimeAnalyticsProps) {
  const [hourlyRateInput, setHourlyRateInput] = useState(settings.hourlyRate);

  // Helper to compute equivalent progressive hours for "Jam Hidup" (Depnaker regulation)
  const getEquivalentHours = (log: OvertimeLog, useJamHidup: boolean) => {
    if (!useJamHidup) return log.durationHours;
    
    // Check if weekend / holiday
    const { isHoliday, isWeekend } = getDayStatus(log.date);
    const isRestDay = isHoliday || isWeekend;
    const hrs = log.durationHours;
    
    if (!isRestDay) {
      // Hari Kerja Biasa: Jam ke-1 = 1.5x, Jam berikutnya = 2.0x
      return Math.min(hrs, 1) * 1.5 + Math.max(0, hrs - 1) * 2;
    } else {
      // Hari Libur Resmi / Sabtu / Minggu:
      // Jam 1 s.d 8 = 2x, Jam ke-9 = 3x, Jam ke-10 dst = 4x
      if (hrs <= 8) {
        return hrs * 2;
      } else if (hrs <= 9) {
        return 16 + (hrs - 8) * 3;
      } else {
        return 16 + 3 + (hrs - 9) * 4;
      }
    }
  };

  // Dynamic reference epoch calculation
  const getReferenceDate = () => {
    if (logs.length === 0) return new Date("2026-05-24T00:00:00Z");
    const dates = logs.map(l => new Date(l.date + "T00:00:00Z").getTime()).filter(t => !isNaN(t));
    if (dates.length === 0) return new Date("2026-05-24T00:00:00Z");
    return new Date(Math.max(...dates));
  };

  const getInitialDatesByPreset = (type: string) => {
    const ref = getReferenceDate();
    let start = "";
    let end = "";

    if (type === "current_month") {
      const y = ref.getFullYear();
      const m = ref.getMonth();
      start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else if (type === "last_month") {
      const d = new Date(ref);
      d.setMonth(d.getMonth() - 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else if (type === "payroll_period") {
      // 21 last month to 20 this month
      const curY = ref.getFullYear();
      const curM = ref.getMonth();
      const prevDate = new Date(curY, curM - 1, 21);
      const prevY = prevDate.getFullYear();
      const prevM = prevDate.getMonth();
      start = `${prevY}-${String(prevM + 1).padStart(2, "0")}-21`;
      end = `${curY}-${String(curM + 1).padStart(2, "0")}-20`;
    } else if (type === "last_3_months") {
      const dStart = new Date(ref);
      dStart.setMonth(dStart.getMonth() - 2);
      const yS = dStart.getFullYear();
      const mS = dStart.getMonth();
      start = `${yS}-${String(mS + 1).padStart(2, "0")}-01`;
      
      const yE = ref.getFullYear();
      const mE = ref.getMonth();
      const lastDay = new Date(yE, mE + 1, 0).getDate();
      end = `${yE}-${String(mE + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
    return { start, end };
  };

  const [filterType, setFilterType] = useState<"current_month" | "last_month" | "payroll_period" | "last_3_months" | "custom">("current_month");
  const [startDateStr, setStartDateStr] = useState(() => getInitialDatesByPreset("current_month").start);
  const [endDateStr, setEndDateStr] = useState(() => getInitialDatesByPreset("current_month").end);

  const handleFilterTypeChange = (type: "current_month" | "last_month" | "payroll_period" | "last_3_months" | "custom") => {
    setFilterType(type);
    if (type !== "custom") {
      const { start, end } = getInitialDatesByPreset(type);
      setStartDateStr(start);
      setEndDateStr(end);
    }
  };

  const getPeriodLabel = () => {
    if (filterType === "current_month") return "Periode Bulan Ini";
    if (filterType === "last_month") return "Periode Bulan Lalu";
    if (filterType === "payroll_period") return "Siklus Kerja Lembur (21 - 20)";
    if (filterType === "last_3_months") return "Rangkuman 3 Bulan Terakhir";
    return "Rentang Kustom Pilihan";
  };

  // Filter logs for the selected range
  const currentMonthLogs = logs.filter((log) => {
    return log.date >= startDateStr && log.date <= endDateStr;
  });

  // Calculations
  const totalHoursMonth = currentMonthLogs.reduce((sum, item) => sum + item.durationHours, 0);
  const totalHoursAllTime = logs.reduce((sum, item) => sum + item.durationHours, 0);

  const isJamHidupActive = settings.overtimeType !== "mati";

  // Calculate total equivalent hours with multipliers
  const equivHoursMonth = currentMonthLogs.reduce((sum, item) => sum + getEquivalentHours(item, isJamHidupActive), 0);
  const equivHoursAllTime = logs.reduce((sum, item) => sum + getEquivalentHours(item, isJamHidupActive), 0);

  const estimatedEarningsMonth = equivHoursMonth * hourlyRateInput;
  const estimatedEarningsAllTime = equivHoursAllTime * hourlyRateInput;

  const targetPercentage = Math.min(
    Math.round((totalHoursMonth / settings.monthlyTargetHours) * 100),
    100
  );

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Extract weekly distribution values for an SVG bar chart
  // Days: Monday - Sunday
  const getWeeklyHours = () => {
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(startOfWeek.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekLogs = logs.filter((log) => {
      const d = new Date(log.date);
      return d >= monday && d <= sunday;
    });

    weekLogs.forEach((log) => {
      const d = new Date(log.date);
      let dayIndex = d.getDay() - 1; // Mon = 0, Sun = 6
      if (dayIndex === -1) dayIndex = 6; // Sunday is 6
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyData[dayIndex] += log.durationHours;
      }
    });

    return weeklyData;
  };

  const weeklyHours = getWeeklyHours();
  const daysLabel = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const maxWeeklyHour = Math.max(...weeklyHours, 1);

  // Group by activity for division summary
  const getActivityGroups = () => {
    const groups: { [key: string]: number } = {};
    currentMonthLogs.forEach((log) => {
      let act = log.activity.toLowerCase();
      // standardise common groups
      if (act.includes("code") || act.includes("dev") || act.includes("coding")) {
        act = "Software Dev";
      } else if (act.includes("bug") || act.includes("fix") || act.includes("debug")) {
        act = "Bug Fixing";
      } else if (act.includes("rapat") || act.includes("meet") || act.includes("coor") || act.includes("koordinasi")) {
        act = "Meetings & Sync";
      } else if (act.includes("deploy") || act.includes("server") || act.includes("infra")) {
        act = "Deploy & Ops";
      } else if (act.includes("dokum") || act.includes("admin") || act.includes("tulis")) {
        act = "Documentation";
      } else {
        act = "Lain-lain / Support";
      }
      groups[act] = (groups[act] || 0) + log.durationHours;
    });

    return Object.entries(groups).map(([name, hours]) => ({ name, hours }));
  };

  const activityGroups = getActivityGroups();
  const activityColors = [
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-400",
    "bg-blue-400",
    "bg-violet-500",
  ];

  const handleRateSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseInt(e.target.value);
    setHourlyRateInput(rate);
    onSettingsChange({ ...settings, hourlyRate: rate });
  };

  const handleTargetChange = (val: number) => {
    onSettingsChange({ ...settings, monthlyTargetHours: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="overtime-statistics-block">
      
      {/* Date Range Selector Header Controls */}
      <div className="md:col-span-2 lg:col-span-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4 text-left animate-fade-in">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Saring Rentang Periode Analisis & Upah Gaji
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik opsi periode cepat atau ganti tanggal di bawah untuk menganalisis bonus lembur kustom (misal: 21 s/d 20).
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleFilterTypeChange("current_month")}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filterType === "current_month"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => handleFilterTypeChange("last_month")}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filterType === "last_month"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => handleFilterTypeChange("payroll_period")}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer pb-1.5 flex items-center gap-1 ${
                filterType === "payroll_period"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tanggal 21 Bulan Lalu s/d Tanggal 20 Bulan Ini"
            >
              💼 Siklus Gaji (21 - 20)
            </button>
            <button
              type="button"
              onClick={() => handleFilterTypeChange("last_3_months")}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filterType === "last_3_months"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3 Bulan Terakhir
            </button>
            <button
              type="button"
              onClick={() => handleFilterTypeChange("custom")}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                filterType === "custom"
                  ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Kustom
            </button>
          </div>
        </div>

        {/* Custom date range display picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 bg-[#0f172a] border border-white/10 p-2.5 rounded-xl focus-within:border-indigo-500/50 transition-all shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pl-1 shrink-0">Tanggal Mulai:</span>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => {
                setStartDateStr(e.target.value);
                setFilterType("custom");
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none w-full cursor-pointer accent-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3 bg-[#0f172a] border border-white/10 p-2.5 rounded-xl focus-within:border-indigo-500/50 transition-all shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pl-1 shrink-0">Tanggal Selesai:</span>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => {
                setEndDateStr(e.target.value);
                setFilterType("custom");
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none w-full cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 1. Calculator / Slider for instant rewards feedback */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-indigo-400" />
              Bonus Lembur
            </h3>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/20 uppercase tracking-wider font-bold">
              Kalkulator
            </span>
          </div>

          <div className="space-y-4">
            {/* Display Big Bonus */}
            <div>
              <span className="text-[10px] text-indigo-300 block uppercase tracking-wider font-mono font-bold">
                {getPeriodLabel()}
              </span>
              <p className="text-3xl font-mono font-black text-indigo-300 tracking-tight mt-1">
                {formatRupiah(estimatedEarningsMonth)}
              </p>
              <div className="mt-1.5 flex flex-col gap-0.5 text-[9px] text-slate-400">
                <span>
                  Batas Periode: <strong className="font-mono text-slate-350">{startDateStr}</strong> s/d <strong className="font-mono text-slate-350">{endDateStr}</strong>
                </span>
                <span>
                  Total seluruh lembur: <strong className="font-mono text-slate-350">{formatRupiah(estimatedEarningsAllTime)}</strong>
                </span>
              </div>
            </div>

            {/* Live Slider adjustment */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center text-[11px] text-slate-300">
                <span>Tarif Upah Per Jam:</span>
                <span className="font-mono font-bold text-indigo-300 text-xs bg-indigo-500/15 py-0.5 px-2 rounded-lg border border-indigo-500/10">
                  {formatRupiah(hourlyRateInput)}/jam
                </span>
              </div>
              
              <input
                type="range"
                min="10000"
                max="100000"
                step="1000"
                value={hourlyRateInput}
                onChange={handleRateSliderChange}
                className="w-full select-none cursor-pointer accent-indigo-500 h-1.5 bg-white/5 rounded-lg hover:accent-indigo-400 transition-all"
              />
              
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Rp 10.000</span>
                <span>Rp 55.000</span>
                <span>Rp 100.000</span>
              </div>
            </div>

            {/* Jam Hidup vs Jam Mati toggle */}
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Metode Perhitungan Upah:</span>
              <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, overtimeType: "hidup" })}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    settings.overtimeType !== "mati"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-extrabold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🟢 Jam Hidup
                </button>
                <button
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, overtimeType: "mati" })}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    settings.overtimeType === "mati"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-extrabold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  🛑 Jam Mati
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed bg-white/5 p-3 rounded-2xl">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            {settings.overtimeType !== "mati" ? (
              <strong className="text-indigo-300">Jam Hidup Aktif:</strong>
            ) : (
              <strong className="text-amber-400">Jam Mati Standby:</strong>
            )}{" "}
            {settings.overtimeType !== "mati" 
              ? "Gaji dihitung otomatis dengan pengali progresif Depnaker RI (weekday: jam-1 x1.5, jam berikutnya x2; weekend/holiday: jam 1-8 x2, jam-9 x3, jam-11+ x4)."
              : "Gaji dihitung standar flat 1x upah per jam kerja tanpa pengali progresif."}
          </span>
        </div>
      </div>

      {/* 2. Target Limit Completion Gauge */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Batas & Target Bulanan
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Limit: {settings.monthlyTargetHours} Jam
            </span>
          </div>

          <div className="flex items-center gap-6 py-2">
            {/* Visual circular percentage stroke element */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-indigo-500 fill-transparent transition-all duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - targetPercentage / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-mono font-black text-slate-100">{targetPercentage}%</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase">Target</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Jam Terisi</span>
                <span className="text-xl font-mono font-bold text-slate-100">
                  {totalHoursMonth.toFixed(1)} <span className="text-xs font-sans text-slate-400">/ {settings.monthlyTargetHours} Jam</span>
                </span>
              </div>

              {/* Increments controls for target */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => handleTargetChange(Math.max(5, settings.monthlyTargetHours - 5))}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] rounded-lg font-semibold cursor-pointer transition-all"
                >
                  -5 Jm
                </button>
                <button
                  onClick={() => handleTargetChange(settings.monthlyTargetHours + 5)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[10px] rounded-lg font-semibold cursor-pointer transition-all"
                >
                  +5 Jm
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-4 pt-4 border-t border-white/5 leading-snug">
          {targetPercentage >= 100 ? (
            <span className="text-indigo-300 font-medium">✨ Target tercapai penuh! Pastikan Anda istirahat yang cukup ya!</span>
          ) : (
            <span>Target kurang <strong className="text-indigo-300 font-mono">{Math.max(0, settings.monthlyTargetHours - totalHoursMonth).toFixed(1)} jam</strong> untuk bulan ini. Kerja bagus!</span>
          )}
        </div>
      </div>

      {/* 3. Bar Chart of Weekly Distribution (Hand-crafted using SVG) */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between md:col-span-2 lg:col-span-1">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Distribusi Minggu Ini
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Total: {weeklyHours.reduce((a, b) => a + b, 0).toFixed(1)} Jam
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative pt-1 font-sans">
            <div className="flex items-end justify-between h-[100px] w-full bg-white/5 px-2 rounded-2xl py-2 border border-white/5">
              {weeklyHours.map((hrs, idx) => {
                const heightPercent = Math.max((hrs / maxWeeklyHour) * 100, 4); // minimum visual height for zeros
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-mono border border-indigo-500/20 pointer-events-none whitespace-nowrap z-20">
                      {hrs.toFixed(1)} jam
                    </div>

                    {/* Interactive column block bar */}
                    <div
                      style={{ height: `${heightPercent}px` }}
                      className={`w-4 rounded-t-md transition-all duration-500 ${
                        hrs > 0
                          ? "bg-gradient-to-t from-indigo-600 to-purple-500 group-hover:from-indigo-500 group-hover:to-purple-400 shadow-sm shadow-indigo-500/20 cursor-help"
                          : "bg-white/5"
                      }`}
                    ></div>
                    
                    {/* Tick initial */}
                    <span className="text-[9px] text-slate-450 font-mono mt-2 uppercase tracking-wide">
                      {daysLabel[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity classification brief chips */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1 max-h-[44px] overflow-hidden">
          {activityGroups.length === 0 ? (
            <span className="text-[10px] text-slate-500 block italic">Belum ada kategori kegiatan terdeteksi minggu ini.</span>
          ) : (
            activityGroups.map((gp, index) => (
              <span
                key={gp.name}
                className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded-lg text-slate-300 flex items-center gap-1 border border-white/5"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activityColors[index % activityColors.length]}`}></span>
                {gp.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
