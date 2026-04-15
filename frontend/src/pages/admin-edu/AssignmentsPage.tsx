import { useState } from "react";
import { Users, CheckCircle, Clock, Search } from "lucide-react";
import { Avatar } from "../../components/Avatar";

interface Assignment {
  id: string;
  employeeName: string;
  testTitle: string;
  deadline: string;
  status: "completed" | "in-progress" | "pending";
  score?: number;
}

const assignments: Assignment[] = [
  { id: "as1", employeeName: "Анна Иванова", testTitle: "Стандарты обслуживания", deadline: "20.04.2026", status: "completed", score: 90 },
  { id: "as2", employeeName: "Кирилл Захаров", testTitle: "Стандарты обслуживания", deadline: "20.04.2026", status: "in-progress" },
  { id: "as3", employeeName: "Мария Федорова", testTitle: "Регламенты точки", deadline: "18.04.2026", status: "in-progress" },
  { id: "as4", employeeName: "Ольга Крылова", testTitle: "Техника допродаж", deadline: "25.04.2026", status: "completed", score: 95 },
  { id: "as5", employeeName: "Иван Волков", testTitle: "Стандарты обслуживания", deadline: "20.04.2026", status: "pending" },
  { id: "as6", employeeName: "Анна Иванова", testTitle: "Знание ассортимента", deadline: "25.04.2026", status: "in-progress" },
];

const statusConfig = {
  completed: { label: "Сдан", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle },
  "in-progress": { label: "В процессе", color: "#2E7D32", bg: "#E8F5E9", icon: Clock },
  pending: { label: "Ожидает", color: "#94A3B8", bg: "#F1F5F9", icon: Clock },
};

export default function AdminEduAssignmentsPage() {
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = assignments.filter(a => {
    if (filter === "in-progress" && a.status !== "in-progress") return false;
    if (filter === "completed" && a.status !== "completed") return false;
    if (searchQuery && !a.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const completedCount = assignments.filter(a => a.status === "completed").length;
  const inProgressCount = assignments.filter(a => a.status === "in-progress").length;
  const pendingCount = assignments.filter(a => a.status === "pending").length;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Назначения</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>Контроль прохождения тестов и курсов</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#2E7D32" }}>{inProgressCount}</p>
            <p style={{ fontSize: 10, color: "#64748B" }}>В процессе</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#22C55E" }}>{completedCount}</p>
            <p style={{ fontSize: 10, color: "#64748B" }}>Сдали</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#94A3B8" }}>{pendingCount}</p>
            <p style={{ fontSize: 10, color: "#64748B" }}>Ожидает</p>
          </div>
        </div>

        <div className="relative">
          <Search size={16} color="#94A3B8" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Поиск по имени сотрудника..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E2E8F0] bg-white" style={{ fontSize: 13, color: "#1E293B", outline: "none" }} />
        </div>

        <div className="flex gap-2">
          {[{ key: "all", label: "Все" }, { key: "in-progress", label: "В процессе" }, { key: "completed", label: "Сдавшие" }].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} className="px-3 py-1.5 rounded-lg" style={{ background: filter === f.key ? "#C41E3A" : "#F1F5F9", color: filter === f.key ? "#fff" : "#374151", fontSize: 12, fontWeight: filter === f.key ? 600 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center"><p style={{ color: "#94A3B8", fontSize: 14 }}>Нет назначений по фильтру</p></div>
          ) : (
            filtered.map((assignment, i) => {
              const cfg = statusConfig[assignment.status];
              return (
                <div key={assignment.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                  <Avatar name={assignment.employeeName} size={36} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{assignment.employeeName}</p>
                    <p style={{ color: "#64748B", fontSize: 12 }}>{assignment.testTitle}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>до {assignment.deadline}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: cfg.bg }}>
                      <cfg.icon size={10} color={cfg.color} />
                      <span style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{cfg.label}</span>
                    </div>
                    {assignment.score && <span style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>{assignment.score}%</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2" style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}>
          <Users size={16} />
          Назначить тест сотрудникам
        </button>
      </div>
    </div>
  );
}
