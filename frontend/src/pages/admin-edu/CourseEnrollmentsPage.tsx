import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import type { Course, CourseEnrollment, CourseTestItem } from "../../types/knowledge";
import { getErrorMessage } from "../../utils/errors";
import { ConfirmDialog } from "./manage/ConfirmDialog";

export default function CourseEnrollmentsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const id = Number(courseId);
  const backTo = location.pathname.startsWith("/admin-po/preview")
    ? "/admin-po/preview/edu/assignments"
    : "/admin-edu/manage";

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalSystemId, setExternalSystemId] = useState("");

  const [confirm, setConfirm] = useState<
    | { type: "unassign"; userId: string }
    | { type: "reset"; userId: string }
    | { type: "resetTest"; userId: string; testId: number }
    | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [courseData, enrollmentData] = await Promise.all([
        KnowledgeAPI.getCourse(id),
        KnowledgeAPI.listCourseEnrollments(id),
      ]);
      setCourse(courseData);
      setEnrollments(enrollmentData);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить назначения"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssign = async () => {
    if (!externalSystemId.trim()) return;
    try {
      await KnowledgeAPI.assignCourseToUser(id, externalSystemId.trim());
      setExternalSystemId("");
      toast.success("Сотрудник назначен на курс");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось назначить курс"));
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      if (confirm.type === "unassign") {
        await KnowledgeAPI.removeCourseFromUser(id, confirm.userId);
        toast.success("Назначение снято");
      }
      if (confirm.type === "reset") {
        await KnowledgeAPI.resetCourseProgress(id, confirm.userId);
        toast.success("Прогресс курса сброшен");
      }
      if (confirm.type === "resetTest") {
        await KnowledgeAPI.resetTestProgress(id, confirm.userId, confirm.testId);
        toast.success("Попытка теста сброшена");
      }
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
      setConfirm(null);
    }
  };

  const confirmDescription =
    confirm?.type === "unassign"
      ? "Сотрудник будет снят с курса."
      : confirm?.type === "reset"
        ? "Прогресс по курсу будет обнулён."
        : confirm?.type === "resetTest"
          ? "Попытка прохождения теста будет сброшена."
          : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 pt-4 pb-5 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20]">
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1 mb-3 text-white/80 text-sm"
        >
          <ChevronLeft size={18} />
          Управление
        </button>
        <h1 className="text-white text-xl font-bold">{course?.name ?? "Назначения"}</h1>
        <p className="text-white/70 text-sm mt-1">Сотрудники на курсе</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl bg-white shadow-sm p-4 flex gap-2">
          <input
            value={externalSystemId}
            onChange={(e) => setExternalSystemId(e.target.value)}
            placeholder="ID сотрудника из внешней системы"
            className="flex-1 h-10 px-3 rounded-lg border text-sm"
          />
          <button
            onClick={() => void handleAssign()}
            className="h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold"
          >
            Назначить
          </button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-500 py-6">Загрузка...</p>
        ) : enrollments.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">Нет назначенных сотрудников</p>
        ) : (
          enrollments.map((item) => (
            <div key={item.userId} className="rounded-2xl bg-white shadow-sm p-4">
              <p className="font-medium text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-400">{item.externalSystemId}</p>
              <p className="text-sm text-slate-600 mt-1">
                Прогресс: {Math.round(item.progress)}% · {item.isCompleted ? "завершён" : "в процессе"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setConfirm({ type: "reset", userId: item.userId })}
                  className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700"
                >
                  Сбросить прогресс
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm({ type: "unassign", userId: item.userId })}
                  className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700"
                >
                  Снять
                </button>
              </div>
              {course && course.tests.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <p className="text-xs text-slate-500 mb-1">Сброс попытки теста</p>
                  {course.tests.map((test: CourseTestItem) => (
                    <button
                      key={test.testId}
                      type="button"
                      onClick={() =>
                        setConfirm({ type: "resetTest", userId: item.userId, testId: test.testId })
                      }
                      className="block text-xs text-[#2E7D32] py-1"
                    >
                      {test.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title="Подтвердите действие"
        description={confirmDescription}
        loading={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirm()}
      />
    </div>
  );
}
