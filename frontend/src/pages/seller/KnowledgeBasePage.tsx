import { useNavigate } from "react-router";
import { BookOpen, CheckCircle, Clock, AlertCircle, ChevronRight, UserPlus, GraduationCap, Package, ClipboardList, Calendar, Monitor } from "lucide-react";
import { courses } from "../../mock/mockData";

const ICONS: Record<string, React.ElementType> = {
  UserPlus,
  MessageSquare: BookOpen,
  Package,
  ClipboardList,
  Calendar,
  Monitor,
  GraduationCap,
};

const statusConfig = {
  completed: { label: "Пройден", icon: CheckCircle, color: "#22C55E", bg: "#F0FDF4" },
  "in-progress": { label: "В процессе", icon: Clock, color: "#2E7D32", bg: "#E8F5E9" },
  "not-started": { label: "Не начат", icon: AlertCircle, color: "#94A3B8", bg: "#F1F5F9" },
};

export default function KnowledgeBasePage() {
  const navigate = useNavigate();

  const activeCourses = courses.filter(c => c.status === "in-progress");
  const completedCourses = courses.filter(c => c.status === "completed");
  const newCourses = courses.filter(c => c.status === "not-started");

  const overallProgress = Math.round(
    courses.reduce((sum, c) => sum + c.progress, 0) / courses.length
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Обучение</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Мои курсы</h1>

        {/* Overall progress */}
        <div
          className="mt-4 rounded-xl p-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div className="flex-1">
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Общий прогресс обучения</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {completedCourses.length} из {courses.length} курсов пройдено
            </p>
          </div>
          <div>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{overallProgress}%</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Active Courses */}
        {activeCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Активные курсы
            </p>
            <div className="flex flex-col gap-3">
              {activeCourses.map((course) => {
                const Icon = ICONS[course.icon] || BookOpen;
                return (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/seller/knowledge/${course.id}`)}
                    className="rounded-2xl p-4 text-left"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: course.bg }}
                      >
                        <Icon size={24} color={course.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }} className="truncate">
                          {course.title}
                        </h3>
                        <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                          {course.materialsCount} материалов из {course.categories.length} категорий · {course.testsCount} тестов
                        </p>
                        <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 1 }} className="truncate">
                          {course.categories.join(", ")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${course.progress}%`, background: course.color }}
                            />
                          </div>
                          <span style={{ color: course.color, fontSize: 12, fontWeight: 600 }}>
                            {course.progress}%
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

        {/* New Available Courses */}
        {newCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Доступные курсы
            </p>
            <div className="flex flex-col gap-3">
              {newCourses.map((course) => {
                const Icon = ICONS[course.icon] || BookOpen;
                const status = statusConfig[course.status];
                return (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/seller/knowledge/${course.id}`)}
                    className="rounded-2xl p-4 text-left"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: course.bg }}
                      >
                        <Icon size={24} color={course.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }} className="truncate">
                            {course.title}
                          </h3>
                          {course.isRequired && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: "#FEF2F2", color: "#DC2626" }}
                            >
                              Обязательный
                            </span>
                          )}
                        </div>
                        <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                          {course.materialsCount} материалов из {course.categories.length} категорий · {course.duration}
                        </p>
                        <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 1 }} className="truncate">
                          {course.categories.join(", ")}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <status.icon size={12} color={status.color} />
                          <span style={{ color: status.color, fontSize: 11 }}>{status.label}</span>
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

        {/* Completed Courses */}
        {completedCourses.length > 0 && (
          <div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Пройденные курсы
            </p>
            <div className="flex flex-col gap-3">
              {completedCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate(`/seller/knowledge/${course.id}`)}
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
                        {course.title}
                      </h3>
                      <p style={{ color: "#94A3B8", fontSize: 11 }}>
                        Пройден {course.completedAt}
                      </p>
                    </div>
                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
