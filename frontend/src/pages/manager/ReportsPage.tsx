import { useState, useEffect } from "react";
import { FileBarChart, BookOpen } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { ReportsAPI, LearningRatingDTO } from "../../api/ReportsAPI";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

const LEARNING_REPORT = {
  id: "learning",
  title: "Прогресс обучения",
  desc: "Процент прохождения курсов и тестов",
  period: "Текущий период",
  color: "#F5A623",
  bg: "#FFFBEB",
};

export default function ManagerReportsPage() {
  const { user } = useApp();
  const [selected, setSelected] = useState(false);

  const [learningRating, setLearningRating] = useState<LearningRatingDTO | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
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
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        <AppHeader
          title={LEARNING_REPORT.title}
          showBack
          onBack={() => setSelected(false)}
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

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Менеджер</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Отчёты</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <button
          onClick={() => setSelected(true)}
          className="rounded-2xl p-4 flex items-start gap-3 text-left"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: LEARNING_REPORT.bg }}
          >
            <FileBarChart size={20} color={LEARNING_REPORT.color} />
          </div>
          <div className="flex-1">
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{LEARNING_REPORT.title}</p>
            <p style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>{LEARNING_REPORT.desc}</p>
            <p style={{ color: "#F59E0B", fontSize: 11, marginTop: 4, fontWeight: 500 }}>Реальные данные</p>
          </div>
          <span
            className="px-2 py-0.5 rounded-full self-start"
            style={{ background: LEARNING_REPORT.bg, color: LEARNING_REPORT.color, fontSize: 10, fontWeight: 600 }}
          >
            {LEARNING_REPORT.period}
          </span>
        </button>
      </div>
    </div>
  );
}
