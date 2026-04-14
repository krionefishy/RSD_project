// React import not needed in React 18+
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

export default function AdminSalesDashboardPage() {
  const { user } = useApp();
  if (!user) return null;

  const stats = [
    { label: "Выручка сети", value: "12.4M ₽", change: "+8.2%", icon: DollarSign, color: "#1A56DB" },
    { label: "Количество продаж", value: "8,420", change: "+12.1%", icon: ShoppingCart, color: "#22C55E" },
    { label: "Средний чек", value: "1,475 ₽", change: "-2.4%", icon: BarChart3, color: "#F59E0B" },
  ];

  const topBlocks = [
    { name: "Центр", sales: "4.2M ₽", percent: 98 },
    { name: "Юг", sales: "3.8M ₽", percent: 94 },
    { name: "Север", sales: "2.9M ₽", percent: 87 },
    { name: "Запад", sales: "1.5M ₽", percent: 72 },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #1A56DB 0%, #1248BA 100%)" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор продаж</p>
            <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + "15" }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div className="flex items-center gap-1" style={{ color: s.change.startsWith("+") ? "#22C55E" : "#EF4444", fontSize: 13, fontWeight: 600 }}>
                {s.change.startsWith("+") ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {s.change}
              </div>
            </div>
            <p style={{ color: "#1E293B", fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
          </div>
        ))}

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Продажи по блокам</p>
          <div className="flex flex-col gap-3">
            {topBlocks.map((block, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{block.name}</span>
                  <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>{block.sales}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full" style={{ width: `${block.percent}%`, background: block.percent >= 90 ? "#22C55E" : block.percent >= 70 ? "#1A56DB" : "#F59E0B" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
