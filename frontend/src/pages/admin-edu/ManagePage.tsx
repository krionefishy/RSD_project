import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Video, FileText, File, BookOpen } from "lucide-react";
import { courses, courseMaterials } from "../../mock/mockData";
import { Material } from "../../types/data";

const typeIcon = {
  text: <FileText size={14} color="#64748B" />,
  video: <Video size={14} color="#C41E3A" />,
  document: <File size={14} color="#F5A623" />,
};

const statusConfig = {
  completed: { label: "Пройден", color: "#22C55E", bg: "#F0FDF4" },
  "in-progress": { label: "В процессе", color: "#2E7D32", bg: "#E8F5E9" },
  "not-started": { label: "Не начат", color: "#94A3B8", bg: "#F1F5F9" },
};

export default function AdminEduManagePage() {
  const [tab, setTab] = useState<"content" | "tests">("content");
  const [openCourses, setOpenCourses] = useState<string[]>(["course-1"]);

  const toggleCourse = (id: string) =>
    setOpenCourses((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
          Управление курсами
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          {courses.length} курсов · {Object.values(courseMaterials).flat().length} материалов
        </p>
      </div>

      {/* Tabs */}
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
            onClick={() => setTab(t.key as any)}
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

      {tab === "content" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <button
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}
          >
            <Plus size={18} />
            Создать курс
          </button>

          {courses.map((course) => {
            const isOpen = openCourses.includes(course.id);
            const materials = courseMaterials[course.id] || [];
            const status = statusConfig[course.status];

            return (
              <div
                key={course.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {/* Course header */}
                <button
                  onClick={() => toggleCourse(course.id)}
                  className="w-full flex items-center gap-3 px-4 py-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: course.bg }}
                  >
                    <BookOpen size={24} color={course.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>
                        {course.title}
                      </p>
                      {course.isRequired && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ background: "#FEF2F2", color: "#DC2626" }}
                        >
                          Обязательный
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                      {course.materialsCount} материалов · {course.testsCount} тестов ·{" "}
                      {course.duration}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="h-1.5 rounded-full overflow-hidden flex-1"
                        style={{ background: "#E2E8F0" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${course.progress}%`, background: course.color }}
                        />
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={20} color="#94A3B8" />
                  ) : (
                    <ChevronRight size={20} color="#94A3B8" />
                  )}
                </button>

                {/* Materials list */}
                {isOpen && materials.length > 0 && (
                  <div style={{ borderTop: "1px solid #F1F5F9" }}>
                    <div className="px-4 py-2" style={{ background: "#F8FAFC" }}>
                      <p style={{ color: "#64748B", fontSize: 12, fontWeight: 500 }}>
                        Материалы курса
                      </p>
                    </div>
                    {materials.map((mat: Material) => (
                      <div
                        key={mat.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderTop: "1px solid #F1F5F9" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F8FAFC" }}>
                          {typeIcon[mat.type]}
                        </div>
                        <div className="flex-1">
                          <p style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>
                            {mat.title}
                          </p>
                          <p style={{ color: "#94A3B8", fontSize: 11 }}>
                            {mat.duration}
                          </p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: mat.status === "done" ? "#F0FDF4" : mat.status === "in-progress" ? "#E8F5E9" : "#F1F5F9",
                            color: mat.status === "done" ? "#16A34A" : mat.status === "in-progress" ? "#2E7D32" : "#94A3B8",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {mat.status === "done" ? "Пройден" : mat.status === "in-progress" ? "В процессе" : "Не начат"}
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "#F1F5F9" }}
                          >
                            <Edit2 size={14} color="#64748B" />
                          </button>
                          <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "#FEF2F2" }}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-3"
                      style={{ borderTop: "1px solid #F1F5F9", color: "#C41E3A", fontSize: 13, fontWeight: 500 }}
                    >
                      <Plus size={16} />
                      Добавить материал
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "tests" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <button
            className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}
          >
            <Plus size={18} />
            Создать тест
          </button>

          {[
            { title: "Итоговый тест: Базовый курс", course: "Новый сотрудник: Базовый курс", questions: 20, type: "Итоговый", active: true },
            { title: "Проверка знаний: Касса", course: "Новый сотрудник: Базовый курс", questions: 10, type: "Промежуточный", active: true },
            { title: "Тест: Стандарты обслуживания", course: "Стандарты обслуживания", questions: 15, type: "Итоговый", active: true },
            { title: "Тест: Ассортимент", course: "Ассортимент и продукция", questions: 25, type: "Итоговый", active: false },
            { title: "Повторный тест: Допродажи", course: "Стандарты обслуживания", questions: 12, type: "Повторный", active: true },
          ].map((test, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
                    {test.title}
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>
                    {test.course}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: test.type === "Итоговый" ? "#E8F5E9" : test.type === "Повторный" ? "#FEF2F2" : "#E0F7FA",
                        color: test.type === "Итоговый" ? "#2E7D32" : test.type === "Повторный" ? "#DC2626" : "#0891B2",
                        fontSize: 11,
                      }}
                    >
                      {test.type}
                    </span>
                    <span style={{ color: "#64748B", fontSize: 12 }}>
                      {test.questions} вопросов
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "#F1F5F9" }}
                  >
                    <Edit2 size={15} color="#64748B" />
                  </button>
                  <span
                    className="px-2 py-1 rounded-full ml-1"
                    style={{
                      background: test.active ? "#F0FDF4" : "#F1F5F9",
                      color: test.active ? "#16A34A" : "#94A3B8",
                      fontSize: 11,
                      fontWeight: 600,
                      alignSelf: "center",
                    }}
                  >
                    {test.active ? "Активен" : "Неакт."}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
