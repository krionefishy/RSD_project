import { useState } from "react";
import { BookOpen, TrendingUp, Download, ChevronDown } from "lucide-react";

export default function AdminEduReportsPage() {
  const [period] = useState("Апрель 2026");

  const stats = [
    { label: "Среднее прохождение", value: "72%", color: "#C41E3A" },
    { label: "Назначено тестов", value: "86", color: "#2E7D32" },
    { label: "Сдали с 1 попытки", value: "64%", color: "#22C55E" },
    { label: "Просроченных", value: "12", color: "#EF4444" },
  ];

  const topSections = [
    { name: "Организация работы", progress: 82, total: 148 },
    { name: "Стандарты сервиса", progress: 68, total: 148 },
    { name: "Описание продуктов", progress: 45, total: 148 },
    { name: "Технологические карты", progress: 91, total: 148 },
  ];

  const topEmployees = [
    { name: "Ольга Крылова", progress: 98, tests: 5 },
    { name: "Мария Федорова", progress: 94, tests: 5 },
    { name: "Кирилл Захаров", progress: 89, tests: 4 },
    { name: "Анна Иванова", progress: 75, tests: 4 },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #C41E3A 0%, #A3152E 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Отчёты</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>Аналитика обучения</p>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
            <span style={{ color: "#fff", fontSize: 12 }}>{period}</span>
            <ChevronDown size={14} color="#fff" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: s.color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Прогресс по разделам</h3>
            <BookOpen size={16} color="#C41E3A" />
          </div>
          <div className="flex flex-col gap-3">
            {topSections.map((section, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "#374151", fontSize: 13 }}>{section.name}</span>
                  <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 600 }}>{section.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full" style={{ width: `${section.progress}%`, background: section.progress >= 80 ? "#22C55E" : section.progress >= 50 ? "#C41E3A" : "#F59E0B" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Лидеры обучения</h3>
            <TrendingUp size={16} color="#22C55E" />
          </div>
          <div className="flex flex-col gap-3">
            {topEmployees.map((emp, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: i < 3 ? "#FCE4EC" : "#F8FAFC" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? "#C41E3A" : "#94A3B8" }}>{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{emp.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{emp.tests} тестов сдано</p>
                </div>
                <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 700 }}>{emp.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2" style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}>
          <Download size={16} />
          Выгрузить отчёт
        </button>
      </div>
    </div>
  );
}
