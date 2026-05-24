/**
 * Helper utility to handle Indonesian National Holidays & Smart Overtime scheduling
 */

// Key Indonesian National Holidays in 2026
export const INDONESIAN_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Tahun Baru Masehi",
  "2026-02-15": "Isra Mi'raj Nabi Muhammad SAW",
  "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
  "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
  "2026-03-20": "Hari Raya Idul Fitri 1447 H (Hari Ke-1)",
  "2026-03-21": "Hari Raya Idul Fitri 1447 H (Hari Ke-2)",
  "2026-04-03": "Wafat Yesus Kristus",
  "2026-04-05": "Hari Paskah",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Kenaikan Yesus Kristus",
  "2026-05-27": "Hari Raya Idul Adha 1447 H",
  "2026-05-31": "Hari Raya Waisak 2570",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "Tahun Baru Islam 1448 H",
  "2026-08-17": "Hari Kemerdekaan RI Ke-81",
  "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-25": "Hari Raya Natal",
};

/**
 * Check if a date is a weekend (Saturday/Sunday) or an Indonesian public holiday
 */
export function getDayStatus(dateInput: Date | string): {
  isHoliday: boolean;
  name: string;
  isWeekend: boolean;
} {
  const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  
  // Format to standard YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Check holiday list
  const holidayName = INDONESIAN_HOLIDAYS_2026[dateString];
  const isHoliday = !!holidayName;

  return {
    isHoliday,
    name: holidayName || (isWeekend ? (dayOfWeek === 0 ? "Minggu" : "Sabtu") : "Hari Kerja"),
    isWeekend,
  };
}

/**
 * Suggest optimal start time for overtime
 * - Saturday / Sunday / Holidat: 07:00
 * - Mon-Fri: 16:00
 */
export function getSuggestedStartTime(dateInput: Date | string): {
  startTime: string;
  reason: string;
  isHolidayOrWeekend: boolean;
} {
  const { isHoliday, isWeekend, name } = getDayStatus(dateInput);

  if (isHoliday) {
    return {
      startTime: "07:00",
      reason: `Tanggal Merah (${name})`,
      isHolidayOrWeekend: true,
    };
  }

  if (isWeekend) {
    return {
      startTime: "07:00",
      reason: `Akhir Pekan (${name})`,
      isHolidayOrWeekend: true,
    };
  }

  return {
    startTime: "16:00",
    reason: "Hari Kerja Aktif",
    isHolidayOrWeekend: false,
  };
}
