import { useState } from "react";
import { FileBarChart, Download, ChevronRight, Filter } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";

const reports = [
  { id: "r1", title: "Мотивация — ежедневный стакан", desc: "План/факт и бонус за ежедневные продажи", period: "Апрель 2026", updated: "14.04.2026", color: "#2E7D32", bg: "#E8F5E9" },
  { id: "r2", title: "Мотивация — периодический стакан", desc: "Сводный расчёт бонуса за период", period: "Q2 2026", updated: "14.04.2026", color: "#C41E3A", bg: "#FCE4EC" },
  { id: "r3", title: "Сводный отчёт по продажам", desc: "Детализация по точкам и продавцам", period: "Апрель 2026", updated: "14.04.2026", color: "#059669", bg: "#ECFDF5" },
  { id: "r4", title: "Прогресс обучения", desc: "Процент прохождения курсов и тестов", period: "Q2 2026", updated: "13.04.2026", color: "#F5A623", bg: "#ECFEFF" },
];

export default function ReportsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [period, setPeriod] = useState("2026-04");
  const periodLabel = period === "2026-03" ? "Март 2026" : period === "2026-05" ? "Май 2026" : "Апрель 2026";

  if (selected) {
    const report = reports.find(r => r.id === selected);
    if (!report) return null;
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        <AppHeader title={report.title} showBack backTo="/manager/reports" white rightAction={
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "#2E7D32" }}>
            <Download size={14} color="#fff" />
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 500 }}>Выгрузить</span>
          </button>
        } />

        {/* Period selector */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="flex-1 h-11 rounded-[10px] border px-3"
              style={{ border: "1.5px solid #E2E8F0", background: "#fff", color: "#1E293B", fontSize: 14 }}
            >
              <option value="2026-03">Март 2026</option>
              <option value="2026-04">Апрель 2026</option>
              <option value="2026-05">Май 2026</option>
            </select>
            <button className="h-11 w-11 rounded-[10px] flex items-center justify-center" style={{ border: "1.5px solid #E2E8F0", background: "#fff" }}>
              <Filter size={18} color="#64748B" />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {/* Header */}
            <div className="flex px-4 py-3" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ flex: 2, color: "#64748B", fontSize: 12, fontWeight: 500 }}>Сотрудник</span>
              <span style={{ flex: 1, color: "#64748B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>План</span>
              <span style={{ flex: 1, color: "#64748B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>Факт</span>
              <span style={{ flex: 1, color: "#64748B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>%</span>
            </div>
            {[
              { name: "А. Иванова", plan: periodLabel === "Май 2026" ? "50 000" : "45 000", fact: "35 100", pct: 78 },
              { name: "К. Захаров", plan: "45 000", fact: "52 400", pct: 116 },
              { name: "М. Федорова", plan: "40 000", fact: "28 800", pct: 72 },
              { name: "О. Крылова", plan: "50 000", fact: "48 500", pct: 97 },
              { name: "П. Орлов", plan: "40 000", fact: "31 200", pct: 78 },
              { name: "Р. Белов", plan: "40 000", fact: "20 000", pct: 50 },
            ].map((row, i, arr) => (
              <div key={i} className="flex px-4 py-3 items-center" style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <span style={{ flex: 2, color: "#1E293B", fontSize: 13 }}>{row.name}</span>
                <span style={{ flex: 1, color: "#64748B", fontSize: 12, textAlign: "right" }}>{row.plan}</span>
                <span style={{ flex: 1, color: "#1E293B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>{row.fact}</span>
                <span style={{
                  flex: 1, fontSize: 12, fontWeight: 600, textAlign: "right",
                  color: row.pct >= 100 ? "#22C55E" : row.pct >= 70 ? "#2E7D32" : "#F59E0B"
                }}>
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Менеджер</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Отчёты</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelected(report.id)}
            className="rounded-2xl p-4 flex items-start gap-3 text-left"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: report.bg }}>
              <FileBarChart size={20} color={report.color} />
            </div>
            <div className="flex-1">
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{report.title}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>{report.desc}</p>
              <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>Обновлено: {report.updated}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-2 py-0.5 rounded-full" style={{ background: report.bg, color: report.color, fontSize: 10, fontWeight: 600 }}>
                {report.period}
              </span>
              <ChevronRight size={16} color="#CBD5E1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
