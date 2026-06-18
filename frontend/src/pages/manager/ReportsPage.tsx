import { useState, useEffect } from "react";
import { FileBarChart, Download, ChevronRight, Filter, BookOpen } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { AppSelect } from "../../components/AppSelect";
import { ReportsAPI, LearningRatingDTO } from "../../api/ReportsAPI";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

const STATIC_REPORTS = [
  { id: "r1", title: "Мотивация — ежедневный стакан", desc: "План/факт и бонус за ежедневные продажи", period: "Апрель 2026", updated: "14.04.2026", color: "#2E7D32", bg: "#E8F5E9" },
  { id: "r2", title: "Мотивация — периодический стакан", desc: "Сводный расчёт бонуса за период", period: "Q2 2026", updated: "14.04.2026", color: "#C41E3A", bg: "#FCE4EC" },
  { id: "r3", title: "Сводный отчёт по продажам", desc: "Детализация по точкам и продавцам", period: "Апрель 2026", updated: "14.04.2026", color: "#059669", bg: "#ECFDF5" },
  { id: "r4", title: "Прогресс обучения", desc: "Процент прохождения курсов и тестов", period: "Текущий период", updated: "", color: "#F5A623", bg: "#FFFBEB" },
];

export default function ManagerReportsPage() {
  const { user } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [period, setPeriod] = useState("2026-04");

  // Learning report state (only for r4)
  const [learningRating, setLearningRating] = useState<LearningRatingDTO | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);

  useEffect(() => {
    if (selected !== "r4") return;
    let cancelled = false;
    setLearningLoading(true);
    setLearningError(null);
    ReportsAPI.getLearningRating(
      user?.blockId ? { scopeType: "block", scopeId: user.blockId } : undefined,
    )
      .then((dto) => {
        if (!cancelled) setLearningRating(dto);
      })
      .catch(() => {
        if (!cancelled) setLearningError("Не удалось загрузить данные");
      })
      .finally(() => {
        if (!cancelled) setLearningLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, user?.blockId]);

  if (selected) {
    const report = STATIC_REPORTS.find((r) => r.id === selected);
    if (!report) return null;

    // Learning report detail — real data
    if (selected === "r4") {
      return (
        <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
          <AppHeader
            title={report.title}
            showBack
            backTo="/manager/reports"
            white
            rightAction={
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "#F59E0B" }}>
                <BookOpen size={14} color="#fff" />
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 500 }}>Обучение</span>
              </div>
            }
          />

          <div className="px-4 py-4">
            {learningLoading ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#fff" }}>
                <p style={{ color: "#64748B", fontSize: 14 }}>Загрузка данных...</p>
              </div>
            ) : learningError ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#fff" }}>
                <p style={{ color: "#EF4444", fontSize: 14 }}>{learningError}</p>
              </div>
            ) : !learningRating || learningRating.items.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "#fff" }}>
                <p style={{ color: "#64748B", fontSize: 14 }}>Нет данных по обучению</p>
                <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 6 }}>
                  Попробуйте пересчитать рейтинг обучения
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div
                  className="rounded-2xl p-4 mb-4 flex gap-4"
                  style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex-1 text-center">
                    <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 800 }}>
                      {learningRating.items.length}
                    </p>
                    <p style={{ color: "#64748B", fontSize: 11 }}>Сотрудников</p>
                  </div>
                  <div style={{ width: 1, background: "#F1F5F9" }} />
                  <div className="flex-1 text-center">
                    <p style={{ color: "#F59E0B", fontSize: 22, fontWeight: 800 }}>
                      {Math.round(
                        learningRating.items.reduce((s, i) => s + (i.completionPct ?? 0), 0) /
                          learningRating.items.length,
                      )}%
                    </p>
                    <p style={{ color: "#64748B", fontSize: 11 }}>Ср. прохождение</p>
                  </div>
                  <div style={{ width: 1, background: "#F1F5F9" }} />
                  <div className="flex-1 text-center">
                    <p style={{ color: "#2E7D32", fontSize: 22, fontWeight: 800 }}>
                      {Math.round(
                        learningRating.items.reduce((s, i) => s + i.totalPoints, 0) /
                          learningRating.items.length,
                      )}
                    </p>
                    <p style={{ color: "#64748B", fontSize: 11 }}>Ср. баллы</p>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div className="flex px-4 py-3" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ flex: 2, color: "#64748B", fontSize: 12, fontWeight: 500 }}>Сотрудник</span>
                    <span style={{ flex: 1, color: "#64748B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>Баллы</span>
                    <span style={{ flex: 1, color: "#64748B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>Выполнено</span>
                  </div>
                  {learningRating.items.map((item, i) => (
                    <div
                      key={item.userId}
                      className="flex px-4 py-3 items-center"
                      style={{ borderBottom: i < learningRating.items.length - 1 ? "1px solid #F1F5F9" : "none" }}
                    >
                      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 700, minWidth: 20, textAlign: "right" }}>
                          {item.rank}
                        </span>
                        <Avatar name={item.userName} size={28} />
                        <span style={{ color: "#1E293B", fontSize: 13 }}>{item.userName}</span>
                      </div>
                      <span style={{ flex: 1, color: "#1E293B", fontSize: 12, fontWeight: 500, textAlign: "right" }}>
                        {item.totalPoints}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: "right",
                          color:
                            (item.completionPct ?? 0) >= 80
                              ? "#22C55E"
                              : (item.completionPct ?? 0) >= 50
                              ? "#F59E0B"
                              : "#94A3B8",
                        }}
                      >
                        {item.completionDisplay ?? `${item.completionPct ?? 0}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Other reports (r1, r2, r3) — static placeholder
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        <AppHeader
          title={report.title}
          showBack
          backTo="/manager/reports"
          white
          rightAction={
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "#2E7D32" }}>
              <Download size={14} color="#fff" />
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 500 }}>Выгрузить</span>
            </button>
          }
        />

        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <AppSelect
              value={period}
              onValueChange={setPeriod}
              className="flex-1 h-11"
              options={[
                { value: "2026-03", label: "Март 2026" },
                { value: "2026-04", label: "Апрель 2026" },
                { value: "2026-05", label: "Май 2026" },
              ]}
            />
            <button
              className="h-11 w-11 rounded-[10px] flex items-center justify-center"
              style={{ border: "1.5px solid #E2E8F0", background: "#fff" }}
            >
              <Filter size={18} color="#64748B" />
            </button>
          </div>

          <div className="rounded-2xl p-8 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Данные будут доступны в следующей версии</p>
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
        {STATIC_REPORTS.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelected(report.id)}
            className="rounded-2xl p-4 flex items-start gap-3 text-left"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: report.bg }}
            >
              <FileBarChart size={20} color={report.color} />
            </div>
            <div className="flex-1">
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{report.title}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>{report.desc}</p>
              {report.id === "r4" ? (
                <p style={{ color: "#F59E0B", fontSize: 11, marginTop: 4, fontWeight: 500 }}>Реальные данные</p>
              ) : (
                <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
                  {report.updated ? `Обновлено: ${report.updated}` : report.period}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ background: report.bg, color: report.color, fontSize: 10, fontWeight: 600 }}
              >
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
