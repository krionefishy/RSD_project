import { FileText, Download } from "lucide-react";
import { showDemoActionToast } from "../../utils/demoToast";

const REPORTS = [
  { title: "Отчёт по активным сессиям", date: "02.06.2026" },
  { title: "Аудит изменений ролей", date: "01.06.2026" },
  { title: "Статистика ошибок API", date: "31.05.2026" },
];

export default function AdminPOReportsPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-4" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Отчёты</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
          Системные и административные
        </p>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">
        {REPORTS.map((report) => (
          <button
            key={report.title}
            type="button"
            onClick={() => showDemoActionToast()}
            className="rounded-2xl p-4 w-full flex items-center gap-3 text-left"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <FileText size={22} color="#2E7D32" />
            <div className="flex-1 min-w-0">
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{report.title}</p>
              <p style={{ color: "#94A3B8", fontSize: 12 }}>{report.date}</p>
            </div>
            <Download size={18} color="#94A3B8" />
          </button>
        ))}
      </div>
    </div>
  );
}
