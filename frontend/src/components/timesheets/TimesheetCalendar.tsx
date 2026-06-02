import { useEffect, useMemo, useState } from "react";
import { TimesheetMonthFilter } from "./TimesheetMonthFilter";
import type { TimesheetEntry } from "../../types/profile";
import { entryVisualType, formatMonthTitle } from "../../utils/timesheet";

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

export interface TimesheetCalendarProps {
  entries: TimesheetEntry[];
  loading?: boolean;
  error?: string | null;
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  totalHours?: string;
  showSummary?: boolean;
  className?: string;
}

export function TimesheetCalendar({
  entries,
  loading = false,
  error = null,
  monthDate,
  onMonthChange,
  totalHours = "0",
  showSummary = true,
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

  useEffect(() => {
    if (selectedDate !== null && selectedDate > daysInMonth) {
      setSelectedDate(daysInMonth > 0 ? 1 : null);
    }
  }, [daysInMonth, selectedDate]);

  const daysWithEntries = new Set(entries.map((entry) => entry.workDate)).size;
  const absenceEntries = entries.filter((entry) => entryVisualType(entry) === "absence").length;

  return (
    <div className={className}>
      <TimesheetMonthFilter monthDate={monthDate} onChange={onMonthChange} />

      {error && (
        <div
          className="rounded-xl px-3 py-3 mt-4 text-center"
          style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}
        >
          {error}
        </div>
      )}

      <div
        className="rounded-2xl p-4 mt-4"
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
                const visual = dayEntries[0] ? entryVisualType(dayEntries[0]) : "off";
                const cfg = typeConfig[visual];
                const isSelected = date === selectedDate;
                const isToday = isCurrentMonth && date === today.getDate();
                const hasEntries = dayEntries.length > 0;

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
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

      {selectedDate !== null && !loading && (
        <div
          className="rounded-2xl p-4 mt-3"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {selectedDate} {formatMonthTitle(monthDate).split(" ")[0].toLowerCase()}
          </p>
          {selectedEntries.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: 13 }}>Нет записей на этот день</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEntries.map((entry) => {
                const visual = entryVisualType(entry);
                const cfg = typeConfig[visual];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: cfg.bg }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#fff" }}
                    >
                      <span style={{ color: cfg.color, fontSize: 14, fontWeight: 700 }}>{entry.hours}</span>
                    </div>
                    <div>
                      <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                        {entry.activityName} ({entry.activityCode})
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>
                        {cfg.label} · {entry.hours} ч
                      </p>
                    </div>
                  </div>
                );
              })}
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
              { label: "Записей", value: entries.length, color: "#2E7D32" },
              { label: "Дней с записями", value: daysWithEntries, color: "#64748B" },
              { label: "Отсутствий", value: absenceEntries, color: "#F59E0B" },
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
