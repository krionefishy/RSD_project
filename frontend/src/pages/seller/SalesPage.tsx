import { formatMonthYear } from "../../utils/date";

export default function SalesPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{formatMonthYear()}</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Мои продажи</h1>
      </div>

      <div className="px-4 py-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            Продажи
          </p>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.5 }}>
            Этот раздел появится в будущих версиях приложения.
          </p>
        </div>
      </div>
    </div>
  );
}
