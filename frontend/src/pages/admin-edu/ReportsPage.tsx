import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, TrendingUp, Download, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { ReportsAPI, LearningRatingDTO } from "../../api/ReportsAPI";
import type { CourseListItem } from "../../api/KnowledgeAPI";

interface CourseEnrollmentSummary {
  courseId: number;
  courseName: string;
  total: number;
  completed: number;
  progressPct: number;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  learning_users: "По сотрудникам",
  learning_by_block: "По блокам",
  learning_by_location: "По точкам",
  learning_rating: "Рейтинг",
};

export default function AdminEduReportsPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [enrollmentSummaries, setEnrollmentSummaries] = useState<CourseEnrollmentSummary[]>([]);
  const [rating, setRating] = useState<LearningRatingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export state
  const [reportType, setReportType] = useState("learning_users");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseList, ratingData] = await Promise.all([
        KnowledgeAPI.listAdminCourses(),
        ReportsAPI.getLearningRating(),
      ]);
      setCourses(courseList);
      setRating(ratingData);

      const summaries = await Promise.all(
        courseList.map(async (course) => {
          try {
            const enrollments = await KnowledgeAPI.listCourseEnrollments(course.id);
            const total = enrollments.length;
            const completed = enrollments.filter((e) => e.isCompleted).length;
            const progressPct = total > 0 ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / total) : 0;
            return { courseId: course.id, courseName: course.name, total, completed, progressPct };
          } catch {
            return { courseId: course.id, courseName: course.name, total: 0, completed: 0, progressPct: 0 };
          }
        }),
      );
      setEnrollmentSummaries(summaries);
    } catch (err) {
      setError("Ошибка загрузки данных");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await ReportsAPI.recalculateLearningRating();
      const ratingData = await ReportsAPI.getLearningRating();
      setRating(ratingData);
    } catch (err) {
      console.error("Recalculate failed", err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownload = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { jobId } = await ReportsAPI.createExport({ reportType });

      const POLL_INTERVAL_MS = 2000;
      const MAX_POLL_ATTEMPTS = 90; // 3 minutes total
      let attempts = 0;

      pollRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > MAX_POLL_ATTEMPTS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setExporting(false);
          setExportError("Превышено время ожидания генерации отчёта");
          return;
        }
        try {
          const status = await ReportsAPI.getExport(jobId);
          if (status.parseStatus === "completed" && status.presignedUrl) {
            if (pollRef.current) clearInterval(pollRef.current);
            setExporting(false);
            window.open(status.presignedUrl, "_blank");
          } else if (status.parseStatus === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setExporting(false);
            setExportError("Ошибка генерации отчёта");
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          setExporting(false);
          setExportError("Ошибка получения статуса отчёта");
        }
      }, POLL_INTERVAL_MS);
    } catch {
      setExporting(false);
      setExportError("Ошибка запуска генерации отчёта");
    }
  };

  const totalEnrolled = enrollmentSummaries.reduce((s, e) => s + e.total, 0);
  const totalCompleted = enrollmentSummaries.reduce((s, e) => s + e.completed, 0);
  const avgProgress = enrollmentSummaries.length > 0
    ? Math.round(enrollmentSummaries.reduce((s, e) => s + e.progressPct, 0) / enrollmentSummaries.length)
    : 0;

  const stats = [
    { label: "Среднее прохождение", value: loading ? "—" : `${avgProgress}%`, color: "#C41E3A" },
    { label: "Всего курсов", value: loading ? "—" : String(courses.length), color: "#2E7D32" },
    { label: "Завершили курс", value: loading ? "—" : String(totalCompleted), color: "#22C55E" },
    { label: "Всего зачислений", value: loading ? "—" : String(totalEnrolled), color: "#F59E0B" },
  ];

  const topLeaders = rating?.items.slice(0, 5) ?? [];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <ScreenBackButton to="/admin-edu" light className="mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Отчёты</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>Аналитика обучения</p>
          </div>
          {rating && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
              <ChevronDown size={14} color="#fff" />
              <span style={{ color: "#fff", fontSize: 11 }}>
                {new Date(rating.periodFrom).toLocaleDateString("ru-RU")} — {new Date(rating.periodTo).toLocaleDateString("ru-RU")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: "#FEE2E2", color: "#DC2626" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: s.color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Course progress section */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Прогресс по курсам</h3>
            <BookOpen size={16} color="#C41E3A" />
          </div>
          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Загрузка...</p>
          ) : enrollmentSummaries.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Нет данных</p>
          ) : (
            <div className="flex flex-col gap-3">
              {enrollmentSummaries.map((section) => (
                <div key={section.courseId}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: "#374151", fontSize: 13 }}>{section.courseName}</span>
                    <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 600 }}>{section.progressPct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${section.progressPct}%`,
                        background:
                          section.progressPct >= 80 ? "#22C55E" : section.progressPct >= 50 ? "#C41E3A" : "#F59E0B",
                      }}
                    />
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>
                    {section.completed} из {section.total} завершили
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning rating leaderboard */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Лидеры обучения</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleRecalculate()}
                disabled={recalculating}
                style={{ color: "#2E7D32", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
              >
                <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} />
                {recalculating ? "..." : "Обновить"}
              </button>
              <TrendingUp size={16} color="#22C55E" />
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Загрузка...</p>
          ) : topLeaders.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>
              Рейтинг ещё не сформирован.{" "}
              <button
                onClick={() => void handleRecalculate()}
                style={{ color: "#2E7D32", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}
              >
                Рассчитать
              </button>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topLeaders.map((emp) => (
                <div key={emp.userId} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: emp.rank <= 3 ? "#FCE4EC" : "#F8FAFC" }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: emp.rank <= 3 ? "#C41E3A" : "#94A3B8" }}>
                      {emp.rank}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{emp.userName}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>{emp.completionDisplay ?? emp.metricDisplay}</p>
                  </div>
                  <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 700 }}>{emp.metricDisplay}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export section */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>Выгрузить отчёт (XLSX)</h3>

          <div className="flex flex-col gap-2 mb-3">
            {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="reportType"
                  value={key}
                  checked={reportType === key}
                  onChange={() => setReportType(key)}
                  style={{ accentColor: "#C41E3A" }}
                />
                <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
              </label>
            ))}
          </div>

          {exportError && (
            <p style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>{exportError}</p>
          )}

          <button
            onClick={() => void handleDownload()}
            disabled={exporting}
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
            style={{
              background: exporting ? "#9CA3AF" : "#C41E3A",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? "Генерация..." : "Выгрузить"}
          </button>
        </div>
      </div>
    </div>
  );
}
