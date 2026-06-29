import type { OwnTimesheetQuery, ShiftType } from "../types/profile";

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const SHIFT_TYPE_OPTIONS: Array<{ value: ShiftType; label: string }> = [
  { value: "day", label: "Дневная" },
  { value: "night", label: "Вечерняя" },
  { value: "none", label: "Без смены" },
];

export const SHIFT_CODE_OPTIONS: Array<{ value: "С1" | "С2"; label: string }> = [
  { value: "С1", label: "С1 — Дневная" },
  { value: "С2", label: "С2 — Вечерняя" },
];

export function shiftTypeLabel(shiftType: string): string {
  return SHIFT_TYPE_OPTIONS.find((item) => item.value === shiftType)?.label ?? shiftType;
}

export function shiftCodeLabel(shiftCode?: string): string {
  if (shiftCode === "С1") return "Дневная";
  if (shiftCode === "С2") return "Вечерняя";
  return shiftCode ?? "";
}

export function formatShiftTimeRange(startsAt?: string, endsAt?: string): string | null {
  if (!startsAt || !endsAt) return null;
  return `${startsAt}–${endsAt}`;
}

export function isWorkShift(entry: { shiftCode?: string | null }): boolean {
  return entry.shiftCode === "С1" || entry.shiftCode === "С2";
}

export function formatMonthTitle(monthDate: Date): string {
  return `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
}

export function formatWorkDateLabel(workDate: string): string {
  const [year, month, day] = workDate.split("-").map(Number);
  if (!year || !month || !day) return workDate;
  const date = new Date(year, month - 1, day);
  const formatted = date.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShiftDescription(entry: {
  shiftCode?: string;
  startsAt?: string;
  endsAt?: string;
}): string {
  const code = entry.shiftCode ?? "—";
  const label = shiftCodeLabel(entry.shiftCode);
  const timeRange = formatShiftTimeRange(entry.startsAt, entry.endsAt);
  return timeRange ? `${code} — ${label} (${timeRange})` : `${code} — ${label}`;
}

export function monthPeriodQuery(monthDate: Date): OwnTimesheetQuery {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, "0");
  return {
    periodFrom: `${year}-${monthStr}-01`,
    periodTo: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function mapTimesheetErrorMessage(message: string): string {
  const mapping: Record<string, string> = {
    "Night activity requires night shift": "Код «Н» допустим только с ночной сменой",
    "Work activity requires day shift": "Код «Я» допустим только с дневной сменой",
    "Absence and day off activities require none shift": "Отсутствие и выходной требуют смену «Без смены»",
    "Invalid shift type": "Недопустимый тип смены",
    "Duplicate time entry for date and shift": "Запись на эту дату и смену уже существует",
    "Shift already assigned for this date": "У сотрудника уже назначена эта смена на выбранную дату",
    "Activity code not found": "Код активности не найден",
    "Time entry not found": "Запись табеля не найдена",
    "Only .xls and .xlsx files are supported": "Поддерживаются только файлы .xls и .xlsx",
    "Empty file": "Файл пустой",
    "period_from must be <= period_to": "Начало периода должно быть не позже конца",
  };
  return mapping[message] ?? message;
}

export function workDateFromMonthDay(monthDate: Date, day: number): string {
  const monthStr = String(monthDate.getMonth() + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  return `${monthDate.getFullYear()}-${monthStr}-${dayStr}`;
}

export function suggestShiftTypeForActivity(activityCode: string): ShiftType {
  if (activityCode === "Н") return "night";
  if (activityCode === "Я") return "day";
  return "none";
}

export function entryVisualType(entry: {
  hours: string;
  shiftType: string;
  activityCode: string;
  shiftCode?: string;
}): "work" | "off" | "absence" {
  if (isWorkShift(entry)) return "work";
  const hours = Number.parseFloat(entry.hours);
  if (entry.activityCode === "Б" || entry.activityCode === "О") return "absence";
  if (entry.shiftType === "none" || hours <= 0) return "off";
  return "work";
}
