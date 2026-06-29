import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TimesheetMonthFilter } from "./TimesheetMonthFilter";
import type { TimesheetEntry } from "../../types/profile";
import {
  entryVisualType,
  formatMonthTitle,
  formatShiftTimeRange,
  formatWorkDateLabel,
  isWorkShift,
  shiftCodeLabel,
  workDateFromMonthDay,
} from "../../utils/timesheet";

const typeConfig = {
  work: { color: "#2E7D32", bg: "#E8F5E9", label: "Смена" },
  off: { color: "#94A3B8", bg: "#F1F5F9", label: "Выходной" },
  absence: { color: "#F59E0B", bg: "#FFFBEB", label: "Отсутствие" },
};

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function entriesByDate(entries: TimesheetEntry[]): Map<number, TimesheetEntry[]> {
  const map = new Map<number, TimesheetEntry[]>();
  for (const entry of entries) {
    const day = Number.parseInt(entry.workDate.slice(-2), 10);
    const list = map.get(day) ?? [];
    list.push(entry);
    map.set(day, list);
  }
  return map;
}

function ShiftEntryCard({
  entry,
  showEmployees,
}: {
  entry: TimesheetEntry;
  showEmployees: boolean;
}) {
  const visual = entryVisualType(entry);
  const cfg = typeConfig[visual];
  const timeRange = formatShiftTimeRange(entry.startsAt, entry.endsAt);

  if (isWorkShift(entry)) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl p-3"
        style={{ background: cfg.bg }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#fff" }}
        >
          <span style={{ color: cfg.color, fontSize: 15, fontWeight: 800 }}>{entry.shiftCode}</span>
        </div>
        <div className="flex-1 min-w-0">
          {showEmployees && entry.userName && (
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              {entry.userName}
            </p>
          )}
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
            {shiftCodeLabel(entry.shiftCode)}
          </p>
          {timeRange && (
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{timeRange}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ background: cfg.bg }}
    >
      <div className="flex-1 min-w-0">
        {showEmployees && entry.userName && (
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            {entry.userName}
          </p>
        )}
        <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
          {entry.activityName} ({entry.activityCode})
        </p>
        <p style={{ color: "#64748B", fontSize: 12 }}>
          {cfg.label}
          {entry.hours ? ` · ${entry.hours} ч` : ""}
        </p>
      </div>
    </div>
  );
}

export interface TimesheetCalendarProps {
  entries: TimesheetEntry[];
  loading?: boolean;
  error?: string | null;
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  showMonthFilter?: boolean;
  totalHours?: string;
  showSummary?: boolean;
  showEmployees?: boolean;
  allowAssign?: boolean;
  onAssignShift?: (workDate: string) => void;
  className?: string;
}

export function TimesheetCalendar({
  entries,
  loading = false,
  error = null,
  monthDate,
  onMonthChange,
  showMonthFilter = true,
  totalHours = "0",
  showSummary = true,
  showEmployees = false,
  allowAssign = false,
  onAssignShift,
  className = "",
}: TimesheetCalendarProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

  const daysInMonth = useMemo(
    () => new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate(),
    [monthDate],
  );
  const byDate = useMemo(() => entriesByDate(entries), [entries]);
  const firstDayOffset = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const isCurrentMonth =
    monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();
  const selectedEntries = selectedDate ? byDate.get(selectedDate) ?? [] : [];
  const shiftEntries = selectedEntries.filter(isWorkShift);

  useEffect(() => {
    if (selectedDate !== null && selectedDate > daysInMonth) {
      setSelectedDate(daysInMonth > 0 ? 1 : null);
    }
  }, [daysInMonth, selectedDate]);

  const daysWithEntries = new Set(entries.map((entry) => entry.workDate)).size;
  const shiftCount = entries.filter(isWorkShift).length;

  const handleDayClick = (date: number) => {
    setSelectedDate(date);
  };

  const selectedWorkDate =
    selectedDate !== null ? workDateFromMonthDay(monthDate, selectedDate) : null;

  return (
    <div className={className}>
      {showMonthFilter && <TimesheetMonthFilter monthDate={monthDate} onChange={onMonthChange} />}

      {error && (
        <div
          className={`rounded-xl px-3 py-3 text-center ${showMonthFilter ? "mt-4" : ""}`}
          style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <div
        className={`rounded-2xl p-4 ${showMonthFilter ? "mt-4" : ""}`}
        style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {loading ? (
          <p className="text-center py-6" style={{ color: "#64748B", fontSize: 13 }}>
            Загрузка...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center py-1">
                  <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 500 }}>{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = i + 1;
                const dayEntries = byDate.get(date) ?? [];
                const shiftDay = dayEntries.find(isWorkShift);
                const visual = shiftDay ? entryVisualType(shiftDay) : dayEntries[0] ? entryVisualType(dayEntries[0]) : "off";
                const cfg = typeConfig[visual];
                const isSelected = date === selectedDate;
                const isToday = isCurrentMonth && date === today.getDate();
                const hasEntries = dayEntries.length > 0;

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className="flex flex-col items-center py-1"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: isSelected ? "#2E7D32" : "transparent",
                        border: isToday && !isSelected ? "2px solid #C41E3A" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isToday || isSelected ? 700 : 400,
                          color: isSelected ? "#fff" : isToday ? "#C41E3A" : hasEntries ? cfg.color : "#94A3B8",
                        }}
                      >
                        {date}
                      </span>
                    </div>
                    {hasEntries && !isSelected && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: cfg.color }} />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedDate !== null && !loading && selectedWorkDate && (
        <div
          className="rounded-2xl p-4 mt-3"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, flex: 1 }}>
              {formatWorkDateLabel(selectedWorkDate)}
            </p>
            {allowAssign && onAssignShift && (
              <button
                type="button"
                onClick={() => onAssignShift(selectedWorkDate)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg shrink-0"
                style={{
                  background: "#2E7D32",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Plus size={16} />
                Назначить смену
              </button>
            )}
          </div>
          {shiftEntries.length === 0 && selectedEntries.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: 13 }}>
              {allowAssign ? "На этот день смен пока нет" : "Нет записей на этот день"}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {(shiftEntries.length > 0 ? shiftEntries : selectedEntries).map((entry) => (
                <ShiftEntryCard key={entry.id} entry={entry} showEmployees={showEmployees} />
              ))}
            </div>
          )}
        </div>
      )}

      {showSummary && !loading && (
        <div
          className="rounded-2xl p-4 mt-3"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {formatMonthTitle(monthDate)} — итого
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Смен", value: shiftCount, color: "#2E7D32" },
              { label: "Дней с записями", value: daysWithEntries, color: "#64748B" },
              { label: "Часов", value: totalHours, color: "#C41E3A" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
