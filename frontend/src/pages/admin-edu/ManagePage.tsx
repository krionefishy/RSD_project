import { useEffect, useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  FileText,
  BookOpen,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { PageLoader } from "../../components/PageLoader";
import { Course, CourseListItem } from "../../types/knowledge";

const COURSE_PALETTE = [
  { color: "#2E7D32", bg: "#E8F5E9" },
  { color: "#C41E3A", bg: "#FCE4EC" },
  { color: "#F5A623", bg: "#FFF8E1" },
  { color: "#0891B2", bg: "#E0F7FA" },
  { color: "#7C3AED", bg: "#F3E5F5" },
  { color: "#0F766E", bg: "#CCFBF1" },
];

function paletteFor(id: number) {
  return COURSE_PALETTE[id % COURSE_PALETTE.length];
}

export default function AdminEduManagePage() {
  const [tab, setTab] = useState<"content" | "tests">("content");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCourses, setOpenCourses] = useState<number[]>([]);
  const [details, setDetails] = useState<Record<number, Course>>({});
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    KnowledgeAPI.listCourses(controller.signal)
      .then((items) => {
        setCourses(items);
        setLoading(false);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        const message = getErrorMessage(err, "Не удалось загрузить курсы");
        setError(message);
        setLoading(false);
        toast.error(message);
      });
    return () => {
      controller.abort();
    };
  }, []);

  const toggleCourse = async (id: number) => {
    const isOpen = openCourses.includes(id);
    if (isOpen) {
      setOpenCourses((prev) => prev.filter((c) => c !== id));
      return;
    }
    setOpenCourses((prev) => [...prev, id]);
    if (details[id] || loadingIds.includes(id)) return;
    setLoadingIds((prev) => [...prev, id]);
    const controller = new AbortController();
    try {
      const course = await KnowledgeAPI.getCourse(id, controller.signal);
      setDetails((prev) => ({ ...prev, [id]: course }));
    } catch (err) {
      if (isAbortError(err)) return;
      const message = getErrorMessage(err, "Не удалось загрузить курс");
      toast.error(message);
    } finally {
      setLoadingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const totalMaterials = courses.reduce((sum, c) => sum + c.materialsCount, 0);
  const totalTests = courses.reduce((sum, c) => sum + c.testsCount, 0);

  const reloadCourses = async () => {
    try {
      const items = await KnowledgeAPI.listCourses();
      setCourses(items);
    } catch (err) {
      toast.error("Не удалось обновить список курсов");
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Управление курсами</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          {courses.length} курсов · {totalMaterials} материалов · {totalTests} тестов
        </p>
      </div>

      <div
        className="flex px-4 py-3 gap-2"
        style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}
      >
        {[
          { key: "content", label: "Курсы" },
          { key: "tests", label: "Тесты" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "content" | "tests")}
            className="px-4 py-2 rounded-xl"
            style={{
              background: tab === t.key ? "#C41E3A" : "#F1F5F9",
              color: tab === t.key ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <PageLoader message="Загрузка курсов..." />}

      {!loading && error && (
        <div className="px-4 py-8 text-center">
          <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>
        </div>
      )}

      {!loading && !error && tab === "content" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <CreateCourseButton onCreated={() => void reloadCourses()} />

          {courses.length === 0 && (
            <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
              <p style={{ color: "#64748B", fontSize: 14 }}>Курсы не найдены</p>
            </div>
          )}

          {courses.map((course) => {
            const isOpen = openCourses.includes(course.id);
            const palette = paletteFor(course.id);
            const detail = details[course.id];
            const isDetailLoading = loadingIds.includes(course.id);

            return (
              <div
                key={course.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <button
                  onClick={() => void toggleCourse(course.id)}
                  className="w-full flex items-center gap-3 px-4 py-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: palette.bg }}
                  >
                    <BookOpen size={24} color={palette.color} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p
                      style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}
                      className="truncate"
                    >
                      {course.name}
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                      {course.materialsCount} материалов · {course.testsCount} тестов
                    </p>
                    {course.description && (
                      <p
                        style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}
                        className="line-clamp-1"
                      >
                        {course.description}
                      </p>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronDown size={20} color="#94A3B8" />
                  ) : (
                    <ChevronRight size={20} color="#94A3B8" />
                  )}
                </button>

                {isOpen && (
                  <div style={{ borderTop: "1px solid #F1F5F9" }}>
                    {isDetailLoading && (
                      <div className="px-4 py-4 text-center">
                        <p style={{ color: "#94A3B8", fontSize: 12 }}>Загрузка...</p>
                      </div>
                    )}
                    {!isDetailLoading && detail && (
                      <>
                        <div className="px-4 py-2" style={{ background: "#F8FAFC" }}>
                          <p style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>
                            Материалы курса ({detail.materials.length})
                          </p>
                        </div>
                        {detail.materials.length === 0 && (
                          <p
                            className="px-4 py-3"
                            style={{ color: "#94A3B8", fontSize: 12 }}
                          >
                            Нет материалов
                          </p>
                        )}
                        {detail.materials.map((mat) => (
                          <div
                            key={mat.id}
                            className="flex items-center gap-3 px-4 py-3"
                            style={{ borderTop: "1px solid #F1F5F9" }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "#F8FAFC" }}
                            >
                              <FileText size={14} color="#64748B" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}
                                className="truncate"
                              >
                                {mat.name}
                              </p>
                              <p style={{ color: "#94A3B8", fontSize: 11 }}>
                                {mat.category || "Материал"}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => toast.info("Редактирование материалов скоро будет доступно")}
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "#F1F5F9" }}
                              >
                                <Edit2 size={14} color="#64748B" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => toast.info("Добавление материалов скоро будет доступно")}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3"
                          style={{
                            borderTop: "1px solid #F1F5F9",
                            color: "#C41E3A",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          <Plus size={16} />
                          Добавить материал
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && tab === "tests" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <button
            onClick={() => toast.info("Создание тестов скоро будет доступно")}
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}
          >
            <Plus size={18} />
            Создать тест
          </button>

          {courses.length === 0 && (
            <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
              <p style={{ color: "#64748B", fontSize: 14 }}>Тесты не найдены</p>
            </div>
          )}

          {courses.map((course) => {
            const detail = details[course.id];
            const isOpen = openCourses.includes(course.id);

            const ensure = () => {
              if (!detail && !loadingIds.includes(course.id)) {
                void toggleCourse(course.id);
              } else if (!isOpen) {
                setOpenCourses((prev) => [...prev, course.id]);
              }
            };

            return (
              <div
                key={course.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <button
                  onClick={ensure}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <div className="text-left min-w-0">
                    <p
                      style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}
                      className="truncate"
                    >
                      {course.name}
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: 12 }}>
                      {course.testsCount} тестов
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={18} color="#94A3B8" />
                  ) : (
                    <ChevronRight size={18} color="#94A3B8" />
                  )}
                </button>

                {isOpen && detail && (
                  <div style={{ borderTop: "1px solid #F1F5F9" }}>
                    {detail.tests.length === 0 && (
                      <p
                        className="px-4 py-3"
                        style={{ color: "#94A3B8", fontSize: 12 }}
                      >
                        У курса нет тестов
                      </p>
                    )}
                    {detail.tests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-start justify-between px-4 py-3"
                        style={{ borderTop: "1px solid #F1F5F9" }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}
                            className="truncate"
                          >
                            {test.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                background: test.isFinal ? "#E8F5E9" : "#E0F7FA",
                                color: test.isFinal ? "#2E7D32" : "#0891B2",
                                fontSize: 11,
                              }}
                            >
                              {test.isFinal ? "Итоговый" : "Промежуточный"}
                            </span>
                            <span style={{ color: "#64748B", fontSize: 12 }}>
                              {test.tasksCount} заданий
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toast.info("Редактирование тестов скоро будет доступно")}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "#F1F5F9" }}
                        >
                          <Edit2 size={14} color="#64748B" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateCourseButton({ onCreated }: { onCreated: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ratingPoints, setRatingPoints] = useState(100);
  const [mrp, setMrp] = useState(60);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Введите название курса");
      return;
    }
    setSaving(true);
    try {
      await KnowledgeAPI.createCourse({
        name: name.trim(),
        description: description.trim() || undefined,
        ratingPoints,
        mrp,
      });
      toast.success("Курс создан");
      setShowModal(false);
      setName("");
      setDescription("");
      onCreated();
    } catch (err) {
      toast.error("Не удалось создать курс");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
        style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}
      >
        <Plus size={18} />
        Создать курс
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Создание курса</h3>
            <div className="flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название курса *"
                className="w-full h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border resize-none"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <p style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>Рейтинговые баллы</p>
                  <input
                    type="number"
                    value={ratingPoints}
                    onChange={(e) => setRatingPoints(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-lg border"
                    style={{ borderColor: "#E2E8F0", fontSize: 14 }}
                  />
                </div>
                <div className="flex-1">
                  <p style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>МРП (мин. баллы)</p>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(parseInt(e.target.value) || 0)}
                    className="w-full h-10 px-3 rounded-lg border"
                    style={{ borderColor: "#E2E8F0", fontSize: 14 }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14, fontWeight: 500 }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 500 }}
              >
                {saving ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
