import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, BookOpen, Trophy } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProgressCircle } from "../../components/ProgressCircle";
import { Avatar } from "../../components/Avatar";
import { SellingsAPI, SellingStats } from "../../api/SellingsAPI";
import { KnowledgeAPI, type CourseListItem } from "../../api/KnowledgeAPI";
import { ReportsAPI } from "../../api/ReportsAPI";
import type { Course } from "../../types/knowledge";
import { formatFullDate } from "../../utils/date";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

interface CourseEntry {
  item: CourseListItem;
  course: Course | null;
  progressPercent: number;
}

export default function DashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SellingStats | null>(null);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [learningRank, setLearningRank] = useState<{ position: number; total: number; value: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      try {
        const [statsData, coursesData, learningRating] = await Promise.all([
          SellingsAPI.getStats(controller.signal),
          KnowledgeAPI.listCourses(controller.signal),
          ReportsAPI.getLearningRating(),
        ]);
        setStats(statsData);
        const courseEntries = await Promise.all(
          coursesData.map(async (item) => {
            try {
              const course = await KnowledgeAPI.getCourse(item.id, controller.signal);
              const totalItems = course.materials.length + course.tests.length;
              const completedItems =
                course.materials.filter((material) => material.isCompleted).length +
                course.tests.filter((test) => test.isPassed).length;
              return {
                item,
                course,
                progressPercent: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
              };
            } catch {
              return { item, course: null, progressPercent: 0 };
            }
          }),
        );
        setCourses(courseEntries);
        if (learningRating && user) {
          const me = learningRating.items.find((item) => item.userId === user.id);
          setLearningRank({
            position: me?.rank ?? 0,
            total: learningRating.items.length,
            value: me?.metricDisplay ?? "—",
          });
        } else {
          setLearningRank(null);
        }
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить данные"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, []);

  if (!user) return null;

  const planPercent = stats?.percent ?? 0;
  const planColor = planPercent >= 100 ? "#22C55E" : planPercent >= 70 ? "#2E7D32" : "#F59E0B";
  const remainingCourses = courses.length;
  const overallLearningProgress = remainingCourses
    ? Math.round(courses.reduce((sum, entry) => sum + entry.progressPercent, 0) / remainingCourses)
    : 0;
  const nextCourse = courses.find((entry) => entry.course?.isCourseCompleted !== true) ?? courses[0] ?? null;

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
          {formatFullDate()}
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
                  {loading ? "—" : `${(stats?.fact ?? 0).toLocaleString("ru")} ₽`}
                </p>
              </div>
              <div className="flex justify-between mb-1.5">
                <p style={{ color: "#64748B", fontSize: 12 }}>План</p>
                <p style={{ color: "#64748B", fontSize: 14 }}>
                  {loading ? "—" : `${(stats?.plan ?? 0).toLocaleString("ru")} ₽`}
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
                  {loading ? "—" : `${Math.max((stats?.plan ?? 0) - (stats?.fact ?? 0), 0).toLocaleString("ru")} ₽`}
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
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  {loading ? "Загрузка..." : `${remainingCourses} ${remainingCourses === 1 ? "курс" : remainingCourses < 5 ? "курса" : "курсов"}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(nextCourse ? `/seller/knowledge/${nextCourse.item.id}` : "/seller/knowledge")}
              className="px-3 py-1.5 rounded-[8px]"
              style={{ background: "#C41E3A", color: "#fff", fontSize: 12, fontWeight: 500 }}
            >
              Продолжить
            </button>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span style={{ color: "#64748B", fontSize: 12 }}>Прогресс обучения</span>
              <span style={{ color: "#C41E3A", fontSize: 12, fontWeight: 600 }}>{overallLearningProgress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${overallLearningProgress}%`, background: "#C41E3A" }}
              />
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
                #{loading ? "—" : learningRank?.position || "—"}
              </span>
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>
                {loading ? "Загрузка данных..." : `Среди ${learningRank?.total ?? 0} сотрудников`}
              </p>
              <p style={{ color: "#64748B", fontSize: 12 }}>
                Обучение:{" "}
                <span style={{ color: "#1E293B", fontWeight: 600 }}>{loading ? "—" : learningRank?.value ?? "—"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
