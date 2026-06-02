import { Target, MapPin } from "lucide-react";
import { useLocation } from "react-router";
import { ScreenBackButton } from "../../components/ScreenBackButton";

const blocks = [
  { name: "Центр", plan: "4.5M ₽", fact: "4.2M ₽", percent: 93 },
  { name: "Юг", plan: "4.0M ₽", fact: "3.8M ₽", percent: 95 },
  { name: "Север", plan: "3.2M ₽", fact: "2.9M ₽", percent: 91 },
  { name: "Запад", plan: "2.0M ₽", fact: "1.5M ₽", percent: 75 },
];

const locations = [
  { name: "ТЦ Метрополис", block: "Север", plan: "820K ₽", fact: "790K ₽", percent: 96 },
  { name: "ТЦ Авиапарк", block: "Центр", plan: "650K ₽", fact: "620K ₽", percent: 95 },
  { name: "ТЦ Европейский", block: "Запад", plan: "480K ₽", fact: "410K ₽", percent: 85 },
];

export default function AdminSalesManagePage() {
  const isPoPreview = useLocation().pathname.startsWith("/admin-po/preview");

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        {!isPoPreview && <ScreenBackButton to="/admin-sales" light className="mb-3" />}
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Управление</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          Планы и факт продаж по сети
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} color="#2E7D32" />
            <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Планы по блокам</p>
          </div>
          <div className="flex flex-col gap-3">
            {blocks.map((block) => (
              <div key={block.name} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{block.name}</span>
                  <span style={{ color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>{block.percent}%</span>
                </div>
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  План {block.plan} · Факт {block.fact}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "#E2E8F0" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${block.percent}%`,
                      background: block.percent >= 90 ? "#22C55E" : "#2E7D32",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} color="#2E7D32" />
            <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Планы по точкам</p>
          </div>
          <div className="flex flex-col gap-2">
            {locations.map((loc) => (
              <div key={loc.name} className="flex items-center justify-between px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                <div>
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{loc.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{loc.block}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>{loc.percent}%</p>
                  <p style={{ color: "#64748B", fontSize: 11 }}>{loc.fact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
