import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { managerEmployees, managerStores } from "../../mock/mockData";

const statusBadge = {
  work: { label: "На смене", color: "#22C55E", bg: "#F0FDF4" },
  off: { label: "Выходной", color: "#94A3B8", bg: "#F1F5F9" },
  vacation: { label: "Отпуск", color: "#F5A623", bg: "#ECFEFF" },
  sick: { label: "Больничный", color: "#F59E0B", bg: "#FFFBEB" },
};

export default function EmployeesPage() {
  const [query, setQuery] = useState("");
  const [filterStore, setFilterStore] = useState("all");

  const storeNames = ["all", ...managerStores.map((s) => s.name.split(",")[0])];
  const filtered = managerEmployees.filter((e) => {
    const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchStore = filterStore === "all" || e.store.includes(filterStore);
    return matchQuery && matchStore;
  });

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Блок А — Север</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Сотрудники</h1>
        {/* Search */}
        <div className="mt-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search size={16} color="#94A3B8" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск сотрудника..."
            className="w-full h-10 pl-9 pr-4 rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14 }}
          />
        </div>
      </div>

      {/* Store filter tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ borderBottom: "1px solid #E2E8F0", background: "#fff", scrollbarWidth: "none" }}>
        {storeNames.map((name) => (
          <button
            key={name}
            onClick={() => setFilterStore(name)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full"
            style={{
              background: filterStore === name ? "#2E7D32" : "#F1F5F9",
              color: filterStore === name ? "#fff" : "#374151",
              fontSize: 12,
              fontWeight: filterStore === name ? 600 : 400,
            }}
          >
            {name === "all" ? "Все точки" : name}
          </button>
        ))}
      </div>

      {/* Employee list */}
      <div className="px-4 py-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          {filtered.length} сотрудников
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {filtered.map((emp, i) => {
            const status = statusBadge[emp.status as keyof typeof statusBadge] || statusBadge.off;
            return (
              <button
                key={emp.id}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <Avatar name={emp.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{emp.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>{emp.store}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(emp.salesPercent, 100)}%`, background: emp.salesPercent >= 90 ? "#22C55E" : emp.salesPercent >= 70 ? "#2E7D32" : "#F59E0B" }} />
                    </div>
                    <span style={{ color: "#64748B", fontSize: 11 }}>Продажи: {emp.salesPercent}%</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 600 }}>
                    {status.label}
                  </span>
                  <ChevronRight size={15} color="#CBD5E1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
