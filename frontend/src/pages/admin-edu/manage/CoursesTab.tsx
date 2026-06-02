import { useCallback, useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../../api/KnowledgeAPI";
import type { Course, CourseListItem, Material, Test } from "../../../types/knowledge";
import { getErrorMessage } from "../../../utils/errors";
import { AppSelect } from "../../../components/AppSelect";
import { ConfirmDialog } from "./ConfirmDialog";

export function CoursesTab() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Course>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", ratingPoints: 100, mrp: 60 });

  const [assignMaterialId, setAssignMaterialId] = useState<Record<number, string>>({});
  const [assignTestId, setAssignTestId] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseItems, materialItems, testItems] = await Promise.all([
        KnowledgeAPI.listCourses(),
        KnowledgeAPI.listMaterials(),
        KnowledgeAPI.listTests(),
      ]);
      setCourses(courseItems);
      setMaterials(materialItems);
      setTests(testItems);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить курсы"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (id: number) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!details[id]) {
      try {
        const course = await KnowledgeAPI.getCourse(id);
        setDetails((prev) => ({ ...prev, [id]: course }));
      } catch (error) {
        toast.error(getErrorMessage(error, "Не удалось загрузить курс"));
      }
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Введите название курса");
      return;
    }
    try {
      await KnowledgeAPI.createCourse({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        ratingPoints: form.ratingPoints,
        mrp: form.mrp,
      });
      toast.success("Курс создан");
      setShowCreate(false);
      setForm({ name: "", description: "", ratingPoints: 100, mrp: 60 });
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать курс"));
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await KnowledgeAPI.deleteCourse(deleteId);
      toast.success("Курс удалён");
      setDeleteId(null);
      if (openId === deleteId) setOpenId(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить курс"));
    } finally {
      setDeleting(false);
    }
  };

  const assignMaterial = async (courseId: number) => {
    const materialId = Number(assignMaterialId[courseId]);
    if (!materialId) return;
    try {
      await KnowledgeAPI.assignMaterialToCourse(courseId, materialId);
      setAssignMaterialId((prev) => ({ ...prev, [courseId]: "" }));
      const course = await KnowledgeAPI.getCourse(courseId);
      setDetails((prev) => ({ ...prev, [courseId]: course }));
      await load();
      toast.success("Материал добавлен в курс");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось привязать материал"));
    }
  };

  const removeMaterial = async (courseId: number, materialId: number) => {
    try {
      await KnowledgeAPI.removeMaterialFromCourse(courseId, materialId);
      const course = await KnowledgeAPI.getCourse(courseId);
      setDetails((prev) => ({ ...prev, [courseId]: course }));
      await load();
      toast.success("Материал отвязан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось отвязать материал"));
    }
  };

  const assignTest = async (courseId: number) => {
    const testId = Number(assignTestId[courseId]);
    if (!testId) return;
    try {
      await KnowledgeAPI.assignTestToCourse(courseId, testId, false);
      setAssignTestId((prev) => ({ ...prev, [courseId]: "" }));
      const course = await KnowledgeAPI.getCourse(courseId);
      setDetails((prev) => ({ ...prev, [courseId]: course }));
      await load();
      toast.success("Тест добавлен в курс");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось привязать тест"));
    }
  };

  const removeTest = async (courseId: number, testId: number) => {
    try {
      await KnowledgeAPI.removeTestFromCourse(courseId, testId);
      const course = await KnowledgeAPI.getCourse(courseId);
      setDetails((prev) => ({ ...prev, [courseId]: course }));
      await load();
      toast.success("Тест отвязан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось отвязать тест"));
    }
  };

  if (loading) {
    return <p className="text-center py-8 text-sm text-slate-500">Загрузка курсов...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 bg-[#C41E3A] text-white text-sm font-semibold"
      >
        <Plus size={18} />
        Создать курс
      </button>

      {courses.map((course) => {
        const detail = details[course.id];
        const isOpen = openId === course.id;
        const linkedMaterialIds = new Set(detail?.materials.map((m) => m.materialId) ?? []);
        const linkedTestIds = new Set(detail?.tests.map((t) => t.testId) ?? []);

        return (
          <div key={course.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-4">
              <button type="button" onClick={() => void toggle(course.id)} className="flex items-center gap-3 flex-1 text-left">
                <BookOpen size={20} color="#2E7D32" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{course.name}</p>
                  <p className="text-xs text-slate-400">
                    {course.materialsCount} материалов · {course.testsCount} тестов
                  </p>
                </div>
                {isOpen ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#94A3B8" />}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin-edu/manage/${course.id}`)}
                className="text-xs text-[#2E7D32] font-medium px-2"
              >
                Назначения
              </button>
              <button type="button" onClick={() => setDeleteId(course.id)} className="p-2 rounded-lg bg-red-50">
                <Trash2 size={16} color="#DC2626" />
              </button>
            </div>

            {isOpen && detail && (
              <div className="border-t border-slate-100 px-4 pb-4 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Материалы</p>
                  {detail.materials.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <button
                        type="button"
                        className="text-sm text-slate-700 text-left"
                        onClick={() => navigate(`/admin-edu/manage/edit-material/${mat.materialId}`)}
                      >
                        {mat.name}
                      </button>
                      <button type="button" onClick={() => void removeMaterial(course.id, mat.materialId)}>
                        <Trash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <AppSelect
                      value={assignMaterialId[course.id] ?? ""}
                      onValueChange={(v) => setAssignMaterialId((prev) => ({ ...prev, [course.id]: v }))}
                      placeholder="Добавить материал..."
                      emptyOption={{ value: "__pick_material__", label: "Добавить материал..." }}
                      className="flex-1 h-9"
                      options={materials
                        .filter((m) => !linkedMaterialIds.has(m.id))
                        .map((m) => ({ value: String(m.id), label: m.name }))}
                    />
                    <button
                      type="button"
                      onClick={() => void assignMaterial(course.id)}
                      className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Тесты</p>
                  {detail.tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-700">{test.name}</span>
                      <button type="button" onClick={() => void removeTest(course.id, test.testId)}>
                        <Trash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <AppSelect
                      value={assignTestId[course.id] ?? ""}
                      onValueChange={(v) => setAssignTestId((prev) => ({ ...prev, [course.id]: v }))}
                      placeholder="Добавить тест..."
                      emptyOption={{ value: "__pick_test__", label: "Добавить тест..." }}
                      className="flex-1 h-9"
                      options={tests
                        .filter((t) => !linkedTestIds.has(t.id))
                        .map((t) => ({ value: String(t.id), label: t.name }))}
                    />
                    <button
                      type="button"
                      onClick={() => void assignTest(course.id)}
                      className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-2">
            <h3 className="font-semibold text-slate-800">Новый курс</h3>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Название"
              className="h-10 px-3 rounded-lg border text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Описание"
              rows={2}
              className="px-3 py-2 rounded-lg border text-sm resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-lg bg-slate-100 text-sm">
                Отмена
              </button>
              <button onClick={() => void handleCreate()} className="flex-1 h-10 rounded-lg bg-[#C41E3A] text-white text-sm">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Удалить курс?"
        description="Курс и все привязки будут удалены без возможности восстановления."
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
