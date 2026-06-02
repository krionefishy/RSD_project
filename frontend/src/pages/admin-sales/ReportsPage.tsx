import { FileText, Download } from "lucide-react";
import { showDemoActionToast } from "../../utils/demoToast";

const reports = [
  { title: "Продажи по сети за месяц", date: "Май 2026", size: "2.4 MB" },
  { title: "План/факт по блокам", date: "Май 2026", size: "1.1 MB" },
  { title: "Мотивация сотрудников", date: "Апрель 2026", size: "890 KB" },
  { title: "Рейтинг продаж", date: "Май 2026", size: "540 KB" },
];

export default function AdminSalesReportsPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Отчёты</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          Сводные отчёты по продажам
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 800 }}>12</p>
            <p style={{ color: "#64748B", fontSize: 11 }}>Отчётов за месяц</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 800 }}>47</p>
            <p style={{ color: "#64748B", fontSize: 11 }}>Точек в отчётах</p>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {reports.map((report, i) => (
            <button
              key={report.title}
              type="button"
              onClick={() => showDemoActionToast(`Скачивание: ${report.title}`)}
              className="w-full flex items-center gap-3 px-4 py-4 text-left"
              style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : undefined }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                <FileText size={18} color="#2E7D32" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{report.title}</p>
                <p style={{ color: "#94A3B8", fontSize: 11 }}>{report.date} · {report.size}</p>
              </div>
              <Download size={18} color="#94A3B8" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
