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
  { value: "night", label: "Ночная" },
  { value: "none", label: "Без смены" },
];

export function shiftTypeLabel(shiftType: string): string {
  return SHIFT_TYPE_OPTIONS.find((item) => item.value === shiftType)?.label ?? shiftType;
}

export function formatMonthTitle(monthDate: Date): string {
  return `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
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
    "Activity code not found": "Код активности не найден",
    "Time entry not found": "Запись табеля не найдена",
    "Only .xls and .xlsx files are supported": "Поддерживаются только файлы .xls и .xlsx",
    "Empty file": "Файл пустой",
    "period_from must be <= period_to": "Начало периода должно быть не позже конца",
  };
  return mapping[message] ?? message;
}

export function suggestShiftTypeForActivity(activityCode: string): ShiftType {
  if (activityCode === "Н") return "night";
  if (activityCode === "Я") return "day";
  return "none";
}

export function entryVisualType(entry: { hours: string; shiftType: string; activityCode: string }): "work" | "off" | "absence" {
  const hours = Number.parseFloat(entry.hours);
  if (entry.activityCode === "Б" || entry.activityCode === "О") return "absence";
  if (entry.shiftType === "none" || hours <= 0) return "off";
  return "work";
}
