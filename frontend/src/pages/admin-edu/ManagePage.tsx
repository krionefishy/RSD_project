import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Video, FileText, File } from "lucide-react";

interface Material {
  id: string;
  title: string;
  type: "text" | "video" | "document";
  status: "published" | "draft";
}

interface Course {
  id: string;
  title: string;
  materialsCount: number;
  materials: Material[];
}

interface Section {
  id: string;
  title: string;
  coursesCount: number;
  courses: Course[];
}

const sections: Section[] = [
  {
    id: "s1",
    title: "Организация работы",
    coursesCount: 2,
    courses: [
      {
        id: "c1",
        title: "Открытие и закрытие смены",
        materialsCount: 3,
        materials: [
          { id: "m1", title: "Открытие смены: пошаговый чеклист", type: "text", status: "published" },
          { id: "m2", title: "Работа с кассовым аппаратом", type: "video", status: "published" },
          { id: "m3", title: "Инструкция по инвентаризации", type: "document", status: "draft" },
        ],
      },
      {
        id: "c2",
        title: "Стандарты обслуживания",
        materialsCount: 3,
        materials: [
          { id: "m4", title: "Стандарты обслуживания клиентов", type: "text", status: "published" },
          { id: "m5", title: "Правила возврата товара", type: "text", status: "published" },
          { id: "m6", title: "Внутренние регламенты", type: "document", status: "published" },
        ],
      },
    ],
  },
  {
    id: "s2",
    title: "Скрипты продаж",
    coursesCount: 1,
    courses: [
      {
        id: "c3",
        title: "Техника продаж",
        materialsCount: 4,
        materials: [
          { id: "m7", title: "Приветствие и установление контакта", type: "text", status: "published" },
          { id: "m8", title: "Выявление потребностей", type: "video", status: "published" },
          { id: "m9", title: "Презентация товара", type: "text", status: "draft" },
          { id: "m10", title: "Работа с возражениями", type: "video", status: "draft" },
        ],
      },
    ],
  },
];

const typeIcon = { text: <FileText size={13} color="#64748B" />, video: <Video size={13} color="#7C3AED" />, document: <File size={13} color="#0891B2" /> };

export default function AdminEduManagePage() {
  const [tab, setTab] = useState<"content" | "tests">("content");
  const [openSections, setOpenSections] = useState<string[]>(["s1"]);
  const [openCourses, setOpenCourses] = useState<string[]>([]);

  const toggleSection = (id: string) => setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleCourse = (id: string) => setOpenCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #7C3AED 0%, #6D28D9 100%)" }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Управление контентом</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-3 gap-2" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        {["content", "tests"].map((t) => (
          <button key={t} onClick={() => setTab(t as any)} className="px-4 py-2 rounded-xl" style={{ background: tab === t ? "#7C3AED" : "#F1F5F9", color: tab === t ? "#fff" : "#374151", fontSize: 13, fontWeight: tab === t ? 600 : 400 }}>
            {t === "content" ? "База знаний" : "Тесты"}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div className="px-4 py-4">
          <button className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 mb-4" style={{ background: "#7C3AED", color: "#fff", fontSize: 14, fontWeight: 600 }}>
            <Plus size={18} />
            Добавить материал
          </button>

          <div className="flex flex-col gap-2">
            {sections.map((section) => {
              const isOpen = openSections.includes(section.id);
              return (
                <div key={section.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-3 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#F5F3FF" }}>
                      <span style={{ fontSize: 16 }}>📁</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{section.title}</p>
                      <p style={{ color: "#94A3B8", fontSize: 11 }}>{section.coursesCount} курса</p>
                    </div>
                    {isOpen ? <ChevronDown size={18} color="#94A3B8" /> : <ChevronRight size={18} color="#94A3B8" />}
                  </button>

                  {isOpen && section.courses.map((course) => {
                    const isCourseOpen = openCourses.includes(course.id);
                    return (
                      <div key={course.id} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <button onClick={() => toggleCourse(course.id)} className="w-full flex items-center gap-3 px-4 py-3" style={{ background: "#F8FAFC" }}>
                          <div className="w-6 flex-shrink-0" />
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                            <span style={{ fontSize: 14 }}>📖</span>
                          </div>
                          <div className="flex-1 text-left">
                            <p style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{course.title}</p>
                            <p style={{ color: "#94A3B8", fontSize: 11 }}>{course.materialsCount} материала</p>
                          </div>
                          {isCourseOpen ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
                        </button>

                        {isCourseOpen && course.materials.map((mat) => (
                          <div key={mat.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1px solid #F1F5F9", background: "#fff" }}>
                            <div className="w-12 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {typeIcon[mat.type]}
                                <p style={{ color: "#374151", fontSize: 13 }}>{mat.title}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{
                              background: mat.status === "published" ? "#F0FDF4" : "#FEF9C3",
                              color: mat.status === "published" ? "#16A34A" : "#A16207",
                              fontSize: 10, fontWeight: 600,
                            }}>
                              {mat.status === "published" ? "Опубл." : "Черновик"}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                              <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                                <Edit2 size={13} color="#64748B" />
                              </button>
                              <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                                <Trash2 size={13} color="#EF4444" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "tests" && (
        <div className="px-4 py-4">
          <button className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 mb-4" style={{ background: "#7C3AED", color: "#fff", fontSize: 14, fontWeight: 600 }}>
            <Plus size={18} />
            Создать тест
          </button>

          <div className="flex flex-col gap-2">
            {[
              { title: "Стандарты обслуживания", section: "Организация работы", questions: 10, type: "Промежуточный", active: true },
              { title: "Регламенты работы точки", section: "Организация работы", questions: 15, type: "Итоговый", active: true },
              { title: "Техника продаж", section: "Скрипты продаж", questions: 12, type: "Промежуточный", active: true },
              { title: "Знание ассортимента 2024", section: "Описание продуктов", questions: 20, type: "Итоговый", active: false },
            ].map((test, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{test.title}</p>
                    <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>{test.section}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1A56DB", fontSize: 11 }}>{test.type}</span>
                      <span style={{ color: "#64748B", fontSize: 12 }}>{test.questions} вопросов</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                      <Edit2 size={15} color="#64748B" />
                    </button>
                    <span className="px-2 py-1 rounded-full ml-1" style={{ background: test.active ? "#F0FDF4" : "#F1F5F9", color: test.active ? "#16A34A" : "#94A3B8", fontSize: 11, fontWeight: 600, alignSelf: "center" }}>
                      {test.active ? "Активен" : "Неакт."}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
