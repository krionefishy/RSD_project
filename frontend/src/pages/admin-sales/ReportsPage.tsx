import { FileBarChart } from "lucide-react";
import { ScreenBackButton } from "../../components/ScreenBackButton";

export default function AdminSalesReportsPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <ScreenBackButton to="/admin-sales" light className="mb-3" />
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Отчёты</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          Сводные отчёты по продажам
        </p>
      </div>

      <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "#E8F5E9" }}
        >
          <FileBarChart size={32} color="#2E7D32" />
        </div>
        <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Будет в следующей версии приложения
        </p>
        <p style={{ color: "#64748B", fontSize: 14, maxWidth: 260, lineHeight: 1.6 }}>
          Отчёты по продажам — план/факт, рейтинги и мотивация — появятся в ближайшем обновлении
        </p>
      </div>
    </div>
  );
}
