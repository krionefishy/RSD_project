import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { APIError } from "../../api/APIClient";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { PageLoader } from "../../components/PageLoader";
import { Course, CourseListItem } from "../../types/knowledge";

interface CourseProgress {
  completedMaterials: number;
  totalMaterials: number;
  completedTests: number;
  totalTests: number;
  percent: number;
}

interface CourseEntry {
  item: CourseListItem;
  course: Course | null;
  progress: CourseProgress | null;
}

const COURSE_PALETTE = [
  { color: "#2E7D32", bg: "#E8F5E9" },
  { color: "#C41E3A", bg: "#FCE4EC" },
  { color: "#F5A623", bg: "#FFF8E1" },
  { color: "#0891B2", bg: "#E0F7FA" },
  { color: "#7C3AED", bg: "#F3E5F5" },
  { color: "#0F766E", bg: "#CCFBF1" },
];

function paletteFor(courseId: number) {
  return COURSE_PALETTE[courseId % COURSE_PALETTE.length];
}

function computeProgress(course: Course): CourseProgress {
  const totalMaterials = course.materials.length;
  const totalTests = course.tests.length;
  const completedMaterials = course.materials.filter((m) => m.isCompleted).length;
  const completedTests = course.tests.filter((t) => t.isPassed).length;
  const total = totalMaterials + totalTests;
  const completed = completedMaterials + completedTests;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completedMaterials, totalMaterials, completedTests, totalTests, percent };
}

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CourseEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const items = await KnowledgeAPI.listCourses();
        const details = await Promise.all(
          items.map((item) =>
            KnowledgeAPI.getCourse(item.id)
              .then((course) => ({ item, course, progress: computeProgress(course) }))
              .catch(() => ({ item, course: null, progress: null }) as CourseEntry),
          ),
        );
        if (!cancelled) setEntries(details);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось загрузить курсы";
        setError(message);
        toast.error(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (entries === null && !error) {
    return <PageLoader fullScreen message="Загрузка курсов..." />;
  }

  if (error && !entries) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px 16px" }}>
        <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  const list = entries ?? [];
  const completedCourses = list.filter((e) => e.course?.isCourseCompleted === true);
  const activeCourses = list.filter(
    (e) => e.course?.isCourseCompleted !== true && (e.progress?.percent ?? 0) > 0,
  );
  const newCourses = list.filter(
    (e) => e.course?.isCourseCompleted !== true && (e.progress?.percent ?? 0) === 0,
  );

  const overallProgress = list.length
    ? Math.round(
        list.reduce((sum, e) => sum + (e.progress?.percent ?? 0), 0) / list.length,
      )
    : 0;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Обучение</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Мои курсы</h1>

        <div
          className="mt-4 rounded-xl p-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div className="flex-1">
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Общий прогресс обучения</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {completedCourses.length} из {list.length} курсов пройдено
            </p>
          </div>
          <div>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{overallProgress}%</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {activeCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Активные курсы
            </p>
            <div className="flex flex-col gap-3">
              {activeCourses.map((entry) => {
                const palette = paletteFor(entry.item.id);
                const progress = entry.progress?.percent ?? 0;
                return (
                  <button
                    key={entry.item.id}
                    onClick={() => navigate(`/seller/knowledge/${entry.item.id}`)}
                    className="rounded-2xl p-4 text-left"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: palette.bg }}
                      >
                        <BookOpen size={24} color={palette.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }} className="truncate">
                          {entry.item.name}
                        </h3>
                        <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                          {entry.item.materialsCount} материалов · {entry.item.testsCount} тестов
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${progress}%`, background: palette.color }}
                            />
                          </div>
                          <span style={{ color: palette.color, fontSize: 12, fontWeight: 600 }}>
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} color="#94A3B8" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {newCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Доступные курсы
            </p>
            <div className="flex flex-col gap-3">
              {newCourses.map((entry) => {
                const palette = paletteFor(entry.item.id);
                return (
                  <button
                    key={entry.item.id}
                    onClick={() => navigate(`/seller/knowledge/${entry.item.id}`)}
                    className="rounded-2xl p-4 text-left"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: palette.bg }}
                      >
                        <BookOpen size={24} color={palette.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }} className="truncate">
                          {entry.item.name}
                        </h3>
                        <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                          {entry.item.materialsCount} материалов · {entry.item.testsCount} тестов
                        </p>
                        {entry.item.description && (
                          <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 1 }} className="truncate">
                            {entry.item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {entry.course ? (
                            <>
                              <AlertCircle size={12} color="#94A3B8" />
                              <span style={{ color: "#94A3B8", fontSize: 11 }}>Не начат</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} color="#94A3B8" />
                              <span style={{ color: "#94A3B8", fontSize: 11 }}>Доступен</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#94A3B8" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {completedCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Пройденные курсы
            </p>
            <div className="flex flex-col gap-3">
              {completedCourses.map((entry) => (
                <button
                  key={entry.item.id}
                  onClick={() => navigate(`/seller/knowledge/${entry.item.id}`)}
                  className="rounded-2xl p-4 text-left"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#F0FDF4" }}
                    >
                      <CheckCircle size={20} color="#22C55E" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }} className="truncate">
                        {entry.item.name}
                      </h3>
                      <p style={{ color: "#94A3B8", fontSize: 11 }}>Курс успешно пройден</p>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {list.length === 0 && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "#fff", border: "1px dashed #E2E8F0" }}
          >
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Пока что курсов не назначено. Обратитесь к руководителю за доступом.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
