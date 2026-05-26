import React, { useState } from "react";
import { TrendingUp, Banknote, Target, Hourglass, Clock, Sparkles, Calendar, Calculator, Percent, ShieldCheck } from "lucide-react";
import { OvertimeLog, OvertimeSettings } from "../types";
import { getDayStatus } from "../utils/holidayHelper";

// PPh 21 TER (Tarif Efektif Rata-rata) PP 58/2023 helpers
export type PTKPStatus = "TK/0" | "TK/1" | "TK/2" | "TK/3" | "K/0" | "K/1" | "K/2" | "K/3";

export function getTERCategory(ptkp: PTKPStatus): "A" | "B" | "C" {
  if (ptkp === "TK/0" || ptkp === "TK/1" || ptkp === "K/0") {
    return "A";
  }
  if (ptkp === "TK/2" || ptkp === "TK/3" || ptkp === "K/1" || ptkp === "K/2") {
    return "B";
  }
  return "C";
}

export function getTERRate(grossSalary: number, category: "A" | "B" | "C"): number {
  if (category === "A") {
    if (grossSalary <= 5400000) return 0;
    if (grossSalary <= 5650000) return 0.0025; // 0.25%
    if (grossSalary <= 5950000) return 0.0050; // 0.5%
    if (grossSalary <= 6300000) return 0.0075; // 0.75%
    if (grossSalary <= 6750000) return 0.0100; // 1%
    if (grossSalary <= 7500000) return 0.0125; // 1.25%
    if (grossSalary <= 8550000) return 0.0150; // 1.5%
    if (grossSalary <= 9650000) return 0.0175; // 1.75%
    if (grossSalary <= 10950000) return 0.0200; // 2%
    if (grossSalary <= 13000000) return 0.0225; // 2.25%
    if (grossSalary <= 15000000) return 0.0250; // 2.5%
    if (grossSalary <= 19000000) return 0.0500; // 5%
    if (grossSalary <= 23000000) return 0.0900; // 9%
    if (grossSalary <= 29000000) return 0.1200; // 12%
    if (grossSalary <= 36000000) return 0.1500; // 15%
    if (grossSalary <= 47000000) return 0.1700; // 17%
    if (grossSalary <= 57000000) return 0.1900; // 19%
    if (grossSalary <= 75000000) return 0.2000; // 20%
    if (grossSalary <= 101000000) return 0.2100; // 21%
    if (grossSalary <= 151000000) return 0.2200; // 22%
    if (grossSalary <= 201000000) return 0.2300; // 23%
    if (grossSalary <= 261000000) return 0.2400; // 24%
    if (grossSalary <= 361000000) return 0.2500; // 25%
    if (grossSalary <= 501000000) return 0.2600; // 26%
    if (grossSalary <= 751000000) return 0.2700; // 27%
    if (grossSalary <= 1001000000) return 0.2800; // 28%
    if (grossSalary <= 1401000000) return 0.2900; // 29%
    if (grossSalary <= 2001000000) return 0.3000; // 30%
    if (grossSalary <= 4101000000) return 0.3100; // 31%
    if (grossSalary <= 5001000000) return 0.3200; // 32%
    return 0.3400; // 34%
  } else if (category === "B") {
    if (grossSalary <= 6200000) return 0;
    if (grossSalary <= 6500000) return 0.0025;
    if (grossSalary <= 6850000) return 0.0050;
    if (grossSalary <= 7300000) return 0.0075;
    if (grossSalary <= 7800000) return 0.0100;
    if (grossSalary <= 8850000) return 0.0125;
    if (grossSalary <= 9850000) return 0.0150;
    if (grossSalary <= 11100000) return 0.0175;
    if (grossSalary <= 13000000) return 0.0200;
    if (grossSalary <= 15100000) return 0.0225;
    if (grossSalary <= 19100000) return 0.0400;
    if (grossSalary <= 23100000) return 0.0850;
    if (grossSalary <= 29100000) return 0.1200;
    if (grossSalary <= 36100000) return 0.1450;
    if (grossSalary <= 47100000) return 0.1650;
    if (grossSalary <= 57100000) return 0.1850;
    if (grossSalary <= 75100000) return 0.1950;
    if (grossSalary <= 101100000) return 0.2050;
    if (grossSalary <= 151100000) return 0.2150;
    if (grossSalary <= 201100000) return 0.2250;
    if (grossSalary <= 261100000) return 0.2350;
    if (grossSalary <= 361100000) return 0.2450;
    if (grossSalary <= 501100000) return 0.2550;
    if (grossSalary <= 751100000) return 0.2650;
    if (grossSalary <= 1001100000) return 0.2750;
    if (grossSalary <= 1401100000) return 0.2850;
    if (grossSalary <= 2001100000) return 0.2950;
    if (grossSalary <= 4101100000) return 0.3050;
    if (grossSalary <= 5001100000) return 0.3150;
    return 0.3350;
  } else { // Kategori C
    if (grossSalary <= 6600000) return 0;
    if (grossSalary <= 6950000) return 0.0025;
    if (grossSalary <= 7350000) return 0.0050;
    if (grossSalary <= 7800000) return 0.0075;
    if (grossSalary <= 8350000) return 0.0100;
    if (grossSalary <= 9400000) return 0.0125;
    if (grossSalary <= 10450000) return 0.0150;
    if (grossSalary <= 11750000) return 0.0175;
    if (grossSalary <= 13750000) return 0.0200;
    if (grossSalary <= 16100000) return 0.0225;
    if (grossSalary <= 20100000) return 0.0300;
    if (grossSalary <= 24100000) return 0.0755;
    if (grossSalary <= 30100000) return 0.1150;
    if (grossSalary <= 37100000) return 0.1400;
    if (grossSalary <= 48100000) return 0.1600;
    if (grossSalary <= 58100000) return 0.1800;
    if (grossSalary <= 76100000) return 0.1900;
    if (grossSalary <= 102100000) return 0.2000;
    if (grossSalary <= 152100000) return 0.2100;
    if (grossSalary <= 202100005) return 0.2200; // micro-tweak
    if (grossSalary <= 262100000) return 0.2300;
    if (grossSalary <= 362100000) return 0.2400;
    if (grossSalary <= 502100000) return 0.2500;
    if (grossSalary <= 752100000) return 0.2600;
    if (grossSalary <= 1002100000) return 0.2700;
    if (grossSalary <= 1402100000) return 0.2800;
    if (grossSalary <= 2002100000) return 0.2900;
    if (grossSalary <= 4102100000) return 0.3000;
    if (grossSalary <= 5002100000) return 0.3100;
    return 0.3300;
  }
}

interface OvertimeAnalyticsProps {
  logs: OvertimeLog[];
  settings: OvertimeSettings;
  onSettingsChange: (settings: OvertimeSettings) => void;
}

export default function OvertimeAnalytics({ logs, settings, onSettingsChange }: OvertimeAnalyticsProps) {
  const [hourlyRateInput, setHourlyRateInput] = useState(settings.hourlyRate);

  // States for PPh 21 simulation (Indonesian Tax PP 58/2023)
  const [isPphActive, setIsPphActive] = useState(() => {
    const saved = localStorage.getItem("pph21_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [baseSalary, setBaseSalary] = useState(() => {
    const saved = localStorage.getItem("pph21_base_salary");
    return saved !== null ? parseInt(saved, 10) : 6000000;
  });
  const [ptkpStatus, setPtkpStatus] = useState<PTKPStatus>(() => {
    const saved = localStorage.getItem("pph21_ptkp_status");
    return (saved as PTKPStatus) || "TK/0";
  });
  const [hasNpwp, setHasNpwp] = useState(() => {
    const saved = localStorage.getItem("pph21_has_npwp");
    return saved !== null ? saved === "true" : true;
  });

  const handlePphActiveToggle = () => {
    const nextVal = !isPphActive;
    setIsPphActive(nextVal);
    localStorage.setItem("pph21_enabled", String(nextVal));
  };

  const handleBaseSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
    setBaseSalary(val);
    localStorage.setItem("pph21_base_salary", String(val));
  };

  const handlePtkpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as PTKPStatus;
    setPtkpStatus(status);
    localStorage.setItem("pph21_ptkp_status", status);
  };

  const handleNpwpToggle = () => {
    const nextVal = !hasNpwp;
    setHasNpwp(nextVal);
    localStorage.setItem("pph21_has_npwp", String(nextVal));
  };

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

  // --- PPh 21 Calculation under Indonesian TER regulations (PP 58/2023) ---
  const terCategory = getTERCategory(ptkpStatus);
  const npwpMultiplier = hasNpwp ? 1.0 : 1.2;
  
  // Tax rate on Base Salary alone
  const baseTERRate = getTERRate(baseSalary, terCategory);
  const pphBase = baseSalary * baseTERRate * npwpMultiplier;
  
  // Tax rate on Total Salary (Base + Overtime)
  const totalGrossMonthly = baseSalary + estimatedEarningsMonth;
  const totalTERRate = getTERRate(totalGrossMonthly, terCategory);
  const pphTotal = totalGrossMonthly * totalTERRate * npwpMultiplier;
  
  // Marginal tax contribution of the overtime component
  const pphOvertimeContribution = Math.max(0, pphTotal - pphBase);
  const netOvertimeEarnings = Math.max(0, estimatedEarningsMonth - pphOvertimeContribution);

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
                {getPeriodLabel()} {isPphActive ? "(Kotor)" : ""}
              </span>
              <p className="text-3xl font-mono font-black text-indigo-300 tracking-tight mt-1">
                {formatRupiah(estimatedEarningsMonth)}
              </p>
              
              {isPphActive && estimatedEarningsMonth > 0 && (
                <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-fade-in text-left">
                  <div className="flex justify-between items-center text-[10px] text-rose-300 font-medium">
                    <span>Estimasi Pajak PPh 21:</span>
                    <span className="font-mono font-bold">-{formatRupiah(pphOvertimeContribution)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-emerald-300 font-bold mt-1 pt-1 border-t border-rose-500/10">
                    <span>Lembur Bersih (Net):</span>
                    <span className="font-mono">{formatRupiah(netOvertimeEarnings)}</span>
                  </div>
                </div>
              )}

              <div className="mt-2.5 flex flex-col gap-0.5 text-[9px] text-slate-400">
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

      {/* 4. PPh 21 TER Interactive Simulation Bento (PP 58/2023) */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left animate-fade-in text-slate-100 space-y-6 md:col-span-2 lg:col-span-3">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400 animate-pulse" />
              Simulasi Pajak Penghasilan PPh 21 (TER PP 58/2023)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Dihitung otomatis menggunakan skema Tarif Efektif Rata-rata (TER) Indonesia sesuai regulasi terbaru Pemerintah RI PP No. 58 Tahun 2023.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handlePphActiveToggle}
            className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              isPphActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            {isPphActive ? "Simulasi Aktif" : "Simulasi Dimatikan"}
          </button>
        </div>

        {isPphActive ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            {/* Column A: Setup parameters */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono mb-3">
                  ⚙️ Pengaturan Gaji & PTKP
                </h4>
                
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
                      Gaji Pokok Bulanan (Rp):
                    </label>
                    <input
                      type="text"
                      value={baseSalary.toLocaleString("id-ID")}
                      onChange={handleBaseSalaryChange}
                      className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 p-2.5 rounded-xl text-slate-200 font-mono font-bold text-xs focus:outline-none focus:border-indigo-500/60 transition-all shadow-sm"
                      placeholder="Masukkan gaji pokok"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
                      Status PTKP (Kategori TER):
                    </label>
                    <select
                      value={ptkpStatus}
                      onChange={handlePtkpChange}
                      className="w-full bg-[#0f172a] border border-white/10 hover:border-white/20 p-2.5 rounded-xl text-slate-200 font-sans font-medium text-xs focus:outline-none focus:border-indigo-500/60 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="TK/0">TK/0 - Lajang (0 Tanggungan)</option>
                      <option value="TK/1">TK/1 - Lajang (1 Tanggungan)</option>
                      <option value="TK/2">TK/2 - Lajang (2 Tanggungan)</option>
                      <option value="TK/3">TK/3 - Lajang (3 Tanggungan)</option>
                      <option value="K/0">K/0 - Kawin (0 Tanggungan)</option>
                      <option value="K/1">K/1 - Kawin (1 Tanggungan)</option>
                      <option value="K/2">K/2 - Kawin (2 Tanggungan)</option>
                      <option value="K/3">K/3 - Kawin (3 Tanggungan)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleNpwpToggle}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                        hasNpwp
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-[#0f172a] border-white/10"
                      }`}
                    >
                      {hasNpwp && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-semibold text-slate-300">
                        Memiliki Kartu NPWP / NIK Terintegrasi
                      </span>
                      {!hasNpwp && (
                        <span className="text-[8px] text-amber-400 font-mono">
                          ⚠️ Tanpa NPWP, tarif dikenakan denda denda pajak +120%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column B: TER tariff check */}
            <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono mb-3">
                  📊 Deteksi Kategori & Tarif TER
                </h4>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-slate-400 font-sans">Kategori TER RI:</span>
                    <span className="font-bold text-indigo-300 text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Kategori {terCategory}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-slate-400 font-sans">Tarif Gaji Saja:</span>
                    <span className="font-bold text-slate-200">
                      {(baseTERRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-slate-400 font-sans">Pajak Gaji Saja:</span>
                    <span className="font-bold text-rose-300">
                      {formatRupiah(pphBase)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-white/5 bg-indigo-500/10 px-2 rounded-xl border border-indigo-500/10">
                    <span className="text-slate-200 font-sans font-semibold">Tarif Gabungan:</span>
                    <span className="font-bold text-indigo-300">
                      {(totalTERRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-400 font-sans">Total Pajak Gabung:</span>
                    <span className="font-bold text-rose-300">
                      {formatRupiah(pphTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 border-t border-white/5 pt-2 italic leading-relaxed">
                *Rumus: Pajak Lembur adalah selisih antara Pajak Gabungan (Gaji + Lembur) dikurangi Pajak Gaji Pokok saja.
              </div>
            </div>

            {/* Column C: Net take home salary outcome */}
            <div className="space-y-4 bg-[#1e1b4b]/25 p-4 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  Rincian Penerimaan Gaji (Net)
                </h4>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-indigo-500/10">
                    <span className="text-slate-300 font-sans">Gaji Pokok Bersih:</span>
                    <span className="font-semibold text-slate-200">
                      {formatRupiah(baseSalary - pphBase)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-indigo-500/10">
                    <span className="text-slate-300 font-sans">Bonus Lembur Bersih:</span>
                    <span className="font-bold text-emerald-300">
                      {formatRupiah(netOvertimeEarnings)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl mt-3 text-left">
                    <span className="text-[9px] text-emerald-400 font-sans uppercase tracking-wider font-bold block mb-1">
                      Estimasi Akhir Take-Home Pay (Gaji + Lembur):
                    </span>
                    <span className="text-lg font-mono font-black text-emerald-200 block text-right animate-pulse">
                      {formatRupiah(totalGrossMonthly - pphTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-emerald-400/90 leading-relaxed font-sans mt-1">
                Lembur berkontribusi menambah penghasilan bersih Anda sebesar <strong>{formatRupiah(netOvertimeEarnings)}</strong> setelah dikurangi pajak.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Calculator className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-400">Simulasi Pajak PPh 21 Ditangguhkan</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto">
              Aktifkan kembali simulasi untuk melihat simulasi kalkulasi, denda NPWP, kategori tarif efektif rata-rata (TER), dan total rincian take home bersih.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
