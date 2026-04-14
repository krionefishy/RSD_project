// React import not needed in React 18+
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { ProgressCircle } from "../../components/ProgressCircle";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { managerStores } from "../../mock/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ManagerDashboardPage() {
  const { user } = useApp();
  if (!user) return null;

  const totalPlan = managerStores.reduce((a, s) => a + s.plan, 0);
  const totalFact = managerStores.reduce((a, s) => a + s.fact, 0);
  const blockPercent = Math.round((totalFact / totalPlan) * 100);
  const blockColor = blockPercent >= 90 ? "#22C55E" : blockPercent >= 70 ? "#2E7D32" : "#F59E0B";

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Менеджер блока</p>
            <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
          </div>
        </div>
        <div
          className="mt-3 px-3 py-1.5 rounded-xl inline-flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>📍</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{user.block}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Block plan card */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Выполнение плана блока</p>
          <div className="flex items-center gap-4">
            <ProgressCircle value={blockPercent} size={100} strokeWidth={10} color={blockColor}>
              <div className="text-center">
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{blockPercent}%</span>
              </div>
            </ProgressCircle>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Факт</span>
                <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>{totalFact.toLocaleString("ru")} ₽</span>
              </div>
              <div className="flex justify-between mb-3">
                <span style={{ color: "#64748B", fontSize: 12 }}>План</span>
                <span style={{ color: "#64748B", fontSize: 13 }}>{totalPlan.toLocaleString("ru")} ₽</span>
              </div>

              {/* Mini store list */}
              {managerStores.slice(0, 3).map((store) => (
                <div key={store.id} className="mb-2">
                  <div className="flex justify-between mb-0.5">
                    <span style={{ color: "#374151", fontSize: 11 }} className="truncate max-w-[120px]">{store.name.split(",")[0]}</span>
                    <span style={{ color: store.percent >= 90 ? "#22C55E" : store.percent >= 70 ? "#2E7D32" : "#F59E0B", fontSize: 11, fontWeight: 600 }}>
                      {store.percent}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(store.percent, 100)}%`, background: store.percent >= 90 ? "#22C55E" : store.percent >= 70 ? "#2E7D32" : "#F59E0B" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All stores bar chart */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Сравнение точек</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={managerStores.map(s => ({ name: s.name.split("№")[1]?.split(",")[0] || s.id, pct: s.percent }))} layout="vertical">
              <XAxis type="number" domain={[0, 120]} hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={32} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Выполнение"]} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={18}
                fill="#2E7D32"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Training stats */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Обучение блока</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: "#F0FDF4" }}>
              <p style={{ color: "#16A34A", fontSize: 22, fontWeight: 700 }}>68%</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Прошли обязательное обучение</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#FEF2F2" }}>
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle size={14} color="#DC2626" />
                <p style={{ color: "#DC2626", fontSize: 22, fontWeight: 700 }}>4</p>
              </div>
              <p style={{ color: "#64748B", fontSize: 12 }}>Просроченных тестов</p>
            </div>
          </div>
        </div>

        {/* Block rating */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #2E7D32, #1B5E20)", boxShadow: "0 4px 12px rgba(26,86,219,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <BarChart3 size={22} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Позиция блока</p>
              <div className="flex items-baseline gap-2">
                <span style={{ color: "#fff", fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
                  #2
                </span>
                <span style={{ color: "#86EFAC", fontSize: 14, fontWeight: 500 }}>↑1</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Среди 5 блоков сети</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
