// React import not needed in React 18+
import { useNavigate } from "react-router";
import { ChevronRight, BookOpen, Trophy } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProgressCircle } from "../../components/ProgressCircle";
import { Avatar } from "../../components/Avatar";
import { salesData, ratingData } from "../../mock/mockData";

export default function DashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const planPercent = salesData.daily.percent;
  const planColor = planPercent >= 100 ? "#22C55E" : planPercent >= 70 ? "#2E7D32" : "#F59E0B";

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={44} />
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1 }}>Добро пожаловать,</p>
              <p style={{ color: "#fff", fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{user.firstName}</p>
            </div>
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 12 }}>
          Вторник, 14 апреля 2026
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Plan card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>План на сегодня</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Выручка точки</p>
            </div>
            <button onClick={() => navigate("/seller/sales")}>
              <ChevronRight size={18} color="#94A3B8" />
            </button>
          </div>
          <div className="flex items-center gap-5">
            <ProgressCircle value={planPercent} size={110} strokeWidth={10} color={planColor}>
              <div className="text-center">
                <span style={{ fontSize: 22, fontWeight: 700, color: "#1E293B" }}>{planPercent}%</span>
              </div>
            </ProgressCircle>
            <div className="flex-1">
              <div className="flex justify-between mb-1.5">
                <p style={{ color: "#64748B", fontSize: 12 }}>Факт</p>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
                  {salesData.daily.fact.toLocaleString("ru")} ₽
                </p>
              </div>
              <div className="flex justify-between mb-1.5">
                <p style={{ color: "#64748B", fontSize: 12 }}>План</p>
                <p style={{ color: "#64748B", fontSize: 14 }}>
                  {salesData.daily.plan.toLocaleString("ru")} ₽
                </p>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(planPercent, 100)}%`, background: planColor }}
                />
              </div>
              <p style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>
                До плана:{" "}
                <span style={{ color: "#1E293B", fontWeight: 600 }}>
                  {(salesData.daily.plan - salesData.daily.fact).toLocaleString("ru")} ₽
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Learning card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FCE4EC" }}>
                <BookOpen size={16} color="#C41E3A" />
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Обучение</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>Осталось 3 курса · 1 тест</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/seller/knowledge")}
              className="px-3 py-1.5 rounded-[8px]"
              style={{ background: "#C41E3A", color: "#fff", fontSize: 12, fontWeight: 500 }}
            >
              Продолжить
            </button>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: "#64748B", fontSize: 12 }}>Прогресс обучения</span>
              <span style={{ color: "#C41E3A", fontSize: 12, fontWeight: 600 }}>58%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
              <div className="h-full rounded-full" style={{ width: "58%", background: "#C41E3A" }} />
            </div>
          </div>
        </div>

        {/* Rating card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FFFBEB" }}>
                <Trophy size={16} color="#D97706" />
              </div>
              <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Мой рейтинг</p>
            </div>
            <button onClick={() => navigate("/seller/rating")}>
              <ChevronRight size={18} color="#94A3B8" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span style={{ fontSize: 44, fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>
                #{ratingData.sales.myPosition}
              </span>
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>
                Среди {ratingData.sales.total} продавцов блока
              </p>
              <p style={{ color: "#64748B", fontSize: 12 }}>
                Продажи: <span style={{ color: "#1E293B", fontWeight: 600 }}>{ratingData.sales.myValue}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
