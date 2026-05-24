/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OvertimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or ""
  endTime: string; // HH:MM or ""
  durationHours: number; // Decimal hours, e.g. 2.5
  activity: string; // Activity details / custom text
  category?: string; // Cek Vibrasi, Cek Material, Penetrant Test, Pressure Test, Lainnya
  plant?: string; // Pabrik I, Pabrik II, Pabrik III
  subPlant?: string; // Sub-pabrik e.g. NH3 A, PHONSKA I, PA3 A
  isTimerLog?: boolean; // True if logged via active stopwatch
  notes?: string; // Optional extra notes
  createdAt: string; // ISO datetime
}

export interface OvertimeSettings {
  hourlyRate: number; // Hourly rate in Rupiah
  monthlyTargetHours: number; // Target monthly overtime hours (default e.g. 20)
  employeeName: string; // User name
  department: string; // User division/department
  overtimeType?: "hidup" | "mati"; // "hidup" for progressive multiplier, "mati" for flat
}
