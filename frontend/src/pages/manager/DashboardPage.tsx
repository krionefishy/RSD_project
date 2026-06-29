import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { BarChart3, MapPin, Users } from "lucide-react";
import { StructureAPI, LocationListItem } from "../../api/StructureAPI";
import { ReportsAPI, LearningRatingDTO } from "../../api/ReportsAPI";

export default function ManagerDashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationListItem[]>([]);
  const [learningRating, setLearningRating] = useState<LearningRatingDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const ratingParams = user?.blockId
        ? { scopeType: "block" as const, scopeId: user.blockId }
        : undefined;
      const [locs, rating] = await Promise.all([
        StructureAPI.listLocations(undefined, controller.signal).catch(() => []),
        ReportsAPI.getLearningRating(ratingParams).catch(() => null),
      ]);
      setLocations(locs);
      setLearningRating(rating);

    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [user?.blockId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  const totalLocations = locations.length;
  const totalEmployees = locations.reduce((sum, l) => sum + l.employees, 0);

  const learningItems = learningRating?.items ?? [];
  const learnedCount = learningItems.filter((i) => (i.completionPct ?? 0) >= 80).length;
  const totalParticipants = learningItems.length;
  const learningPct = totalParticipants > 0
    ? Math.round((learnedCount / totalParticipants) * 100)
    : 0;

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
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{user.blockName ?? user.block ?? "Блок не назначен"}</span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} color="#2E7D32" />
              <span style={{ color: "#64748B", fontSize: 12 }}>Точек</span>
            </div>
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {loading ? "—" : totalLocations}
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} color="#2E7D32" />
              <span style={{ color: "#64748B", fontSize: 12 }}>Сотрудников</span>
            </div>
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {loading ? "—" : totalEmployees}
            </p>
          </div>
        </div>

        {/* Locations list */}
        {locations.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Мои точки</p>
            <div className="flex flex-col gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => navigate(`/manager/locations/${loc.id}`)}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl w-full text-left"
                  style={{ background: "#F8FAFC" }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                    <MapPin size={14} color="#2E7D32" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }} className="truncate">{loc.name}</p>
                    {loc.address && <p style={{ color: "#94A3B8", fontSize: 11 }} className="truncate">{loc.address}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ color: "#64748B", fontSize: 11 }}>{loc.employees} чел.</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sales: will be available when Block 4 is implemented */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", opacity: 0.6 }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Выполнение плана блока</p>
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Данные продаж будут доступны после подключения модуля продаж</p>
        </div>

        {/* Training stats */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Обучение блока</p>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Загрузка...</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: "#F0FDF4" }}>
                <p style={{ color: "#16A34A", fontSize: 22, fontWeight: 700 }}>
                  {learningRating ? `${learningPct}%` : "—"}
                </p>
                <p style={{ color: "#64748B", fontSize: 12 }}>Прошли 80%+ курсов</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "#F0F9FF" }}>
                <p style={{ color: "#0369A1", fontSize: 22, fontWeight: 700 }}>
                  {learningRating ? totalParticipants : "—"}
                </p>
                <p style={{ color: "#64748B", fontSize: 12 }}>Участников рейтинга</p>
              </div>
            </div>
          )}
        </div>

        {/* Top learners from rating */}
        {learningItems.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Топ сотрудников по обучению</p>
            <div className="flex flex-col gap-2">
              {learningItems.slice(0, 5).map((item) => (
                <div key={item.userId} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.rank <= 3 ? "#FCE4EC" : "#F8FAFC" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.rank <= 3 ? "#C41E3A" : "#94A3B8" }}>
                      {item.rank}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{item.userName}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>{item.metricDisplay}</p>
                  </div>
                  {item.completionPct !== null && (
                    <span style={{ color: "#22C55E", fontSize: 13, fontWeight: 700 }}>
                      {item.completionPct}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block rating placeholder */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #2E7D32, #1B5E20)", boxShadow: "0 4px 12px rgba(26,86,219,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <BarChart3 size={22} color="#fff" />
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Сводка блока</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                {totalLocations} точек · {totalEmployees} сотрудников
              </p>
              {learningRating && (
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
                  Обучение: {learningPct}% прошли 80%+ курсов
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
