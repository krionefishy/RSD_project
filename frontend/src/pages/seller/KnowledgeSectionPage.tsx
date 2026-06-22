import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { FileText, CheckCircle, Circle, Award, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../../components/AppHeader";
import { PageLoader } from "../../components/PageLoader";
import { APIError } from "../../api/APIClient";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { Course, CompleteCourseResult } from "../../types/knowledge";

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

export default function KnowledgeSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const courseId = Number(sectionId);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeResult, setCompleteResult] = useState<CompleteCourseResult | null>(null);

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setError("Некорректный идентификатор курса");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    KnowledgeAPI.getCourse(courseId)
      .then((result) => {
        if (!cancelled) {
          setCourse(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось загрузить курс";
        setError(message);
        setLoading(false);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleCompleteClick = () => {
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    setShowCompleteModal(false);
    setCompleting(true);
    try {
      const result = await KnowledgeAPI.completeCourse(courseId);
      setCompleteResult(result);
      if (result.completed) {
        // Refetch course to update isCourseCompleted status
        const updatedCourse = await KnowledgeAPI.getCourse(courseId);
        setCourse(updatedCourse);
      }
    } catch (err) {
      const message = err instanceof APIError ? err.message : "Не удалось завершить курс";
      toast.error(message);
    } finally {
      setCompleting(false);
    }
  };

  const closeResultModal = () => {
    setCompleteResult(null);
  };

  if (loading) {
    return <PageLoader fullScreen message="Загрузка курса..." />;
  }

  if (error || !course) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        <AppHeader title="Курс" showBack backTo="/seller/knowledge" white />
        <div className="px-4 py-8 text-center">
          <p style={{ color: "#DC2626", fontSize: 14 }}>{error ?? "Курс не найден"}</p>
        </div>
      </div>
    );
  }

  const palette = paletteFor(course.id);
  const completedMaterials = course.materials.filter((m) => m.isCompleted).length;
  const totalItems = course.materials.length + course.tests.length;
  const completedItems = completedMaterials + course.tests.filter((t) => t.isPassed).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const isCourseCompleted = course.isCourseCompleted ?? false;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title={course.name} showBack backTo="/seller/knowledge" white />

      <div
        className="px-4 py-4 flex items-center gap-4"
        style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}
      >
        <div className="text-center flex-1">
          <p style={{ color: "#1E293B", fontSize: 20, fontWeight: 700 }}>{course.materials.length}</p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Материалов</p>
        </div>
        <div className="w-px h-10" style={{ background: "#E2E8F0" }} />
        <div className="text-center flex-1">
          <p style={{ color: "#22C55E", fontSize: 20, fontWeight: 700 }}>{completedMaterials}</p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Пройдено</p>
        </div>
        <div className="w-px h-10" style={{ background: "#E2E8F0" }} />
        <div className="text-center flex-1">
          <p className="whitespace-nowrap" style={{ color: palette.color, fontSize: 18, fontWeight: 700 }}>
            {progressPercent}%
          </p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Прогресс</p>
        </div>
      </div>

      <div className="px-4 py-3" style={{ background: "#fff" }}>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPercent}%`, background: palette.color }}
          />
        </div>
      </div>

      {course.description && (
        <div className="px-4 pt-3">
          <p style={{ color: "#64748B", fontSize: 12 }}>{course.description}</p>
        </div>
      )}

      {/* Course Completed Badge */}
      {isCourseCompleted && (
        <div className="px-4 pt-3">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}
          >
            <Award size={28} color="#22C55E" />
            <div>
              <p style={{ color: "#166534", fontSize: 16, fontWeight: 600 }}>
                Курс завершён
              </p>
              <p style={{ color: "#22C55E", fontSize: 13 }}>
                Вы успешно прошли все материалы и тесты
              </p>
            </div>
          </div>
        </div>
      )}

      {course.tests.length > 0 && (
        <div className="px-4 pt-3">
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
            Тесты курса ({course.tests.length})
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {course.tests.map((test, i) => {
              const isBlocked = isCourseCompleted && !test.isPassed;
              return (
                <button
                  key={test.id}
                  onClick={() => {
                    if (!isBlocked) {
                      navigate(
                        test.isPassed
                          ? `/seller/tests/${test.testId}/result?course_id=${course.id}`
                          : `/seller/tests/${test.testId}?course_id=${course.id}`,
                      );
                    }
                  }}
                  disabled={isBlocked}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  style={{
                    borderBottom: i < course.tests.length - 1 ? "1px solid #F1F5F9" : "none",
                    opacity: isBlocked ? 0.5 : 1,
                    cursor: isBlocked ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }} className="truncate">
                      {test.name}
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>
                      {test.tasksCount} заданий{test.isFinal ? " · итоговый" : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      color: test.isPassed ? "#22C55E" : isBlocked ? "#94A3B8" : "#2E7D32",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {test.isPassed
                      ? `Пройдено${test.score != null ? ` · ${test.score}%` : ""}`
                      : isBlocked
                      ? "Недоступен"
                      : "Назначен"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>Материалы курса</p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {course.materials.length === 0 && (
            <div className="px-4 py-5 text-center">
              <p style={{ color: "#94A3B8", fontSize: 13 }}>В курсе пока нет материалов</p>
            </div>
          )}
          {course.materials.map((m, i) => {
            const icon = m.isCompleted ? (
              <CheckCircle size={16} color="#22C55E" />
            ) : (
              <Circle size={16} color="#CBD5E1" />
            );
            const statusLabel = m.isCompleted ? "Пройден" : "Не начат";
            const statusColor = m.isCompleted ? "#22C55E" : "#94A3B8";
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/seller/knowledge/${course.id}/${m.materialId}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderBottom: i < course.materials.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F8FAFC" }}
                >
                  <FileText size={18} color="#64748B" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color: "#1E293B",
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: 1.3,
                      marginBottom: 3,
                    }}
                    className="truncate"
                  >
                    {m.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{m.category || "Материал"}</span>
                    {m.description && (
                      <>
                        <span style={{ color: "#CBD5E1", fontSize: 11 }}>·</span>
                        <span
                          style={{ color: "#94A3B8", fontSize: 11 }}
                          className="truncate"
                        >
                          {m.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {icon}
                  <span style={{ color: statusColor, fontSize: 10, fontWeight: 500 }}>
                    {statusLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complete Course Button */}
      {!isCourseCompleted && (
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={handleCompleteClick}
            disabled={completing}
            className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2"
            style={{
              background: completing ? "#A5D6A7" : "#2E7D32",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <Award size={20} />
            {completing ? "Проверка..." : "Завершить курс"}
          </button>
          <p className="text-center mt-2" style={{ color: "#64748B", fontSize: 12 }}>
            Требуется: все материалы и тесты + минимум {course.mrp} баллов
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#fff" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#E8F5E9" }}
              >
                <Award size={24} color="#2E7D32" />
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 600 }}>
                  Завершить курс?
                </p>
              </div>
            </div>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 20 }}>
              После завершения курса вы сможете просматривать материалы, но не сможете пересдавать тесты.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 h-11 rounded-[10px]"
                style={{ background: "#F1F5F9", color: "#374151", fontSize: 14, fontWeight: 500 }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmComplete}
                className="flex-1 h-11 rounded-[10px]"
                style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 600 }}
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {completeResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#fff" }}
          >
            <button
              onClick={closeResultModal}
              className="absolute top-4 right-4"
              style={{ position: "absolute", top: 16, right: 16 }}
            >
              <X size={20} color="#64748B" />
            </button>

            {completeResult.completed ? (
              <>
                <div className="flex flex-col items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "#F0FDF4" }}
                  >
                    <CheckCircle size={32} color="#22C55E" />
                  </div>
                  <p style={{ color: "#1E293B", fontSize: 20, fontWeight: 700 }}>
                    Поздравляем!
                  </p>
                  <p style={{ color: "#64748B", fontSize: 14, textAlign: "center" }}>
                    {completeResult.message}
                  </p>
                </div>
                <div className="rounded-xl p-4 mb-4" style={{ background: "#F8FAFC" }}>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p style={{ color: "#22C55E", fontSize: 18, fontWeight: 700 }}>
                        {completeResult.completedMaterials}/{completeResult.totalMaterials}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Материалов</p>
                    </div>
                    <div>
                      <p style={{ color: "#22C55E", fontSize: 18, fontWeight: 700 }}>
                        {completeResult.passedTests}/{completeResult.totalTests}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Тестов</p>
                    </div>
                    <div>
                      <p style={{ color: "#22C55E", fontSize: 18, fontWeight: 700 }}>
                        {completeResult.userPoints}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Баллов</p>
                    </div>
                    <div>
                      <p style={{ color: "#22C55E", fontSize: 18, fontWeight: 700 }}>
                        {completeResult.requiredPoints}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Требуется</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "#FEF2F2" }}
                  >
                    <Circle size={32} color="#EF4444" />
                  </div>
                  <p style={{ color: "#1E293B", fontSize: 20, fontWeight: 700 }}>
                    Пока нельзя завершить
                  </p>
                  <p style={{ color: "#64748B", fontSize: 14, textAlign: "center" }}>
                    {completeResult.message}
                  </p>
                </div>
                <div className="rounded-xl p-4 mb-4" style={{ background: "#F8FAFC" }}>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p
                        style={{
                          color: completeResult.completedMaterials >= completeResult.totalMaterials ? "#22C55E" : "#F5A623",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {completeResult.completedMaterials}/{completeResult.totalMaterials}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Материалов</p>
                    </div>
                    <div>
                      <p
                        style={{
                          color: completeResult.passedTests >= completeResult.totalTests ? "#22C55E" : "#F5A623",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {completeResult.passedTests}/{completeResult.totalTests}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Тестов</p>
                    </div>
                    <div>
                      <p
                        style={{
                          color: completeResult.userPoints >= completeResult.requiredPoints ? "#22C55E" : "#F5A623",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {completeResult.userPoints}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Баллов</p>
                    </div>
                    <div>
                      <p style={{ color: "#64748B", fontSize: 18, fontWeight: 700 }}>
                        {completeResult.requiredPoints}
                      </p>
                      <p style={{ color: "#64748B", fontSize: 12 }}>Требуется</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={closeResultModal}
              className="w-full h-11 rounded-[10px]"
              style={{
                background: completeResult.completed ? "#22C55E" : "#F1F5F9",
                color: completeResult.completed ? "#fff" : "#374151",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {completeResult.completed ? "Отлично!" : "Понятно"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
