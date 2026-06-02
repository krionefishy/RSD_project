import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../../api/KnowledgeAPI";
import type { CourseListItem } from "../../../types/knowledge";
import { getErrorMessage } from "../../../utils/errors";

export function AssignmentsTab() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await KnowledgeAPI.listCourses();
      setCourses(items);
      if (!selectedCourseId && items[0]) {
        setSelectedCourseId(String(items[0].id));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить курсы"));
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-center py-8 text-sm text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3">
      <p className="text-sm text-slate-600">
        Выберите курс и перейдите на страницу назначений для управления сотрудниками, сбросом прогресса и
        попыток тестов.
      </p>
      <select
        value={selectedCourseId}
        onChange={(e) => setSelectedCourseId(e.target.value)}
        className="h-10 px-3 rounded-lg border text-sm"
      >
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>
      {selectedCourseId && (
        <button
          type="button"
          onClick={() => navigate(`/admin-edu/manage/${selectedCourseId}`)}
          className="h-10 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold flex items-center justify-center"
        >
          Открыть назначения курса
        </button>
      )}
    </div>
  );
}
