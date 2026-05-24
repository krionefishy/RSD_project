import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthNames = [
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
const monthNamesGenitive = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const typeConfig = {
  work: { color: "#2E7D32", bg: "#E8F5E9", label: "Смена" },
  off: { color: "#94A3B8", bg: "#F1F5F9", label: "Выходной" },
  vacation: { color: "#22C55E", bg: "#F0FDF4", label: "Отпуск" },
  sick: { color: "#F59E0B", bg: "#FFFBEB", label: "Больничный" },
};

type ScheduleDay = {
  date: number;
  type: keyof typeof typeConfig;
  hours: number;
};

function getMonthDays(monthDate: Date): ScheduleDay[] {
  const daysCount = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysCount }, (_, i) => {
    const day = i + 1;
    const weekday = new Date(monthDate.getFullYear(), monthDate.getMonth(), day).getDay();
    if (weekday === 0 || weekday === 6) return { date: day, type: "off", hours: 0 };
    if (day % 17 === 0) return { date: day, type: "sick", hours: 0 };
    if (day % 11 === 0 || day % 12 === 0) return { date: day, type: "vacation", hours: 0 };
    return { date: day, type: "work", hours: 8 };
  });
}

export default function SchedulePage() {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const firstDayOffset = (new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay() + 6) % 7;
  const selectedDay = days.find((d) => d.date === selectedDate);
  const isCurrentMonth =
    monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();
  const totalWorkDays = days.filter((day) => day.type === "work").length;
  const totalOffDays = days.filter((day) => day.type === "off").length;
  const totalVacationDays = days.filter((day) => day.type === "vacation").length;
  const totalHours = days.reduce((sum, day) => sum + day.hours, 0);

  const changeMonth = (offset: number) => {
    setMonthDate((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      const nextDays = getMonthDays(next);
      setSelectedDate(nextDays[0]?.date ?? null);
      return next;
    });
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Расписание" showBack backTo="/seller/profile" white />

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F1F5F9" }}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={18} color="#64748B" />
          </button>
          <span style={{ color: "#1E293B", fontSize: 16, fontWeight: 600 }}>
            {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F1F5F9" }}
            aria-label="Следующий месяц"
          >
            <ChevronRight size={18} color="#64748B" />
          </button>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
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

            {days.map((day) => {
              const cfg = typeConfig[day.type];
              const isSelected = day.date === selectedDate;
              const isToday = isCurrentMonth && day.date === today.getDate();

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
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
                        color: isSelected ? "#fff" : isToday ? "#C41E3A" : cfg.color,
                      }}
                    >
                      {day.date}
                    </span>
                  </div>
                  {!isSelected && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: cfg.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[typeConfig.work, typeConfig.off, typeConfig.vacation, typeConfig.sick].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span style={{ color: "#64748B", fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {selectedDay && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              {selectedDate} {monthNamesGenitive[monthDate.getMonth()]} {monthDate.getFullYear()}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: typeConfig[selectedDay.type].bg }}>
                <span style={{ color: typeConfig[selectedDay.type].color, fontSize: 16, fontWeight: 700 }}>
                  {selectedDay.hours || "-"}
                </span>
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{typeConfig[selectedDay.type].label}</p>
                <p style={{ color: "#64748B", fontSize: 13 }}>
                  {selectedDay.hours > 0 ? `${selectedDay.hours} ч. по табелю` : "Часы не запланированы"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl p-4 mt-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            {monthNames[monthDate.getMonth()]} — итого
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Рабочих дней", value: totalWorkDays, color: "#2E7D32" },
              { label: "Выходных", value: totalOffDays, color: "#94A3B8" },
              { label: "Отпуск", value: totalVacationDays, color: "#22C55E" },
              { label: "Часов", value: totalHours, color: "#C41E3A" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                <p style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
