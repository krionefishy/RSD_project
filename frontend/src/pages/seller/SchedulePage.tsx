import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { scheduleData } from "../../mock/mockData";

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const typeConfig = {
  work: { color: "#2E7D32", bg: "#E8F5E9", label: "Смена" },
  off: { color: "#94A3B8", bg: "#F1F5F9", label: "Выходной" },
  vacation: { color: "#22C55E", bg: "#F0FDF4", label: "Отпуск" },
  sick: { color: "#F59E0B", bg: "#FFFBEB", label: "Больничный" },
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<number | null>(14);

  const firstDayOffset = 2;

  const selectedDay = scheduleData.days.find((d) => d.date === selectedDate);

  const getLegend = () => [
    { ...typeConfig.work, label: "Смена" },
    { ...typeConfig.off, label: "Выходной" },
    { ...typeConfig.vacation, label: "Отпуск" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Расписание" showBack backTo="/seller/profile" white />

      <div className="px-4 py-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F1F5F9" }}>
            <ChevronLeft size={18} color="#64748B" />
          </button>
          <span style={{ color: "#1E293B", fontSize: 16, fontWeight: 600 }}>
            {scheduleData.month}
          </span>
          <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F1F5F9" }}>
            <ChevronRight size={18} color="#64748B" />
          </button>
        </div>

        {/* Calendar card */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center py-1">
                <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 500 }}>{d}</span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {scheduleData.days.map((day) => {
              const cfg = typeConfig[day.type as keyof typeof typeConfig] || typeConfig.off;
              const isSelected = day.date === selectedDate;
              const isToday = day.date === 14;

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className="flex flex-col items-center py-1"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: isSelected ? "#2E7D32" : isToday ? cfg.bg : "transparent",
                      border: isToday && !isSelected ? `1.5px solid ${cfg.color}` : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isToday || isSelected ? 700 : 400,
                        color: isSelected ? "#fff" : cfg.color,
                      }}
                    >
                      {day.date}
                    </span>
                  </div>
                  {/* Dot indicator */}
                  {!isSelected && (
                    <div
                      className="w-1 h-1 rounded-full mt-0.5"
                      style={{ background: cfg.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {getLegend().map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span style={{ color: "#64748B", fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              {selectedDate} апреля 2026
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: typeConfig[selectedDay.type as keyof typeof typeConfig]?.bg || "#F1F5F9",
                }}
              >
                <span style={{ fontSize: 20 }}>
                  {selectedDay.type === "work" ? "💼" :
                    selectedDay.type === "vacation" ? "🌴" :
                    selectedDay.type === "sick" ? "🏥" : "😴"}
                </span>
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                  {typeConfig[selectedDay.type as keyof typeof typeConfig]?.label}
                </p>
                {selectedDay.shift && (
                  <p style={{ color: "#64748B", fontSize: 13 }}>
                    {selectedDay.shift}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div
          className="rounded-2xl p-4 mt-3"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            Апрель — итого
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Рабочих дней", value: "18", color: "#2E7D32" },
              { label: "Выходных", value: "7", color: "#94A3B8" },
              { label: "Отпуск", value: "5", color: "#22C55E" },
              { label: "Часов", value: "144", color: "#C41E3A" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{ background: "#F8FAFC" }}
              >
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
