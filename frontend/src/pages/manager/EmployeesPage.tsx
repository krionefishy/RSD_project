import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, ChevronRight } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { UserAPI } from "../../api/UserAPI";
import { AppUser } from "../../types/user";
import { SellingsAPI } from "../../api/SellingsAPI";
import { useApp } from "../../context/AppContext";
import { useMockAuth } from "../../config/presentationMode";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { toast } from "sonner";

const statusBadge = {
  work: { label: "На смене", color: "#22C55E", bg: "#F0FDF4" },
  off: { label: "Выходной", color: "#94A3B8", bg: "#F1F5F9" },
  vacation: { label: "Отпуск", color: "#F5A623", bg: "#ECFEFF" },
  sick: { label: "Больничный", color: "#F59E0B", bg: "#FFFBEB" },
};

interface EmployeeWithStats extends AppUser {
  salesPercent: number;
  learningPercent: number;
  status: "work" | "off" | "vacation" | "sick";
}

export default function EmployeesPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterStore, setFilterStore] = useState("all");
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEmployees() {
      try {
        const blockId = user?.blockId != null
          ? String(user.blockId)
          : (useMockAuth() ? "1" : undefined);
        if (!blockId) {
          setLoading(false);
          return;
        }

        const users = await UserAPI.listManagedUsers({
          blockId,
          isActive: true,
        }, controller.signal);

        const employeesWithStats = await Promise.all(
          users.map(async (u) => {
            try {
              const stats = await SellingsAPI.getStats(u.id, controller.signal);
              return {
                ...u,
                salesPercent: stats.percent,
                learningPercent: 0,
                status: "off" as const,
              };
            } catch {
              return {
                ...u,
                salesPercent: 0,
                learningPercent: 0,
                status: "off" as const,
              };
            }
          })
        );

        setEmployees(employeesWithStats);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить список сотрудников"));
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
    return () => controller.abort();
  }, [user?.blockId]);

  const storeNames = [
    "all",
    ...Array.from(new Set(employees.map((e) => e.storeName ?? e.store).filter(Boolean) as string[])),
  ];
  const filtered = employees.filter((e) => {
    const matchQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const storeLabel = e.storeName ?? e.store;
    const matchStore = filterStore === "all" || storeLabel === filterStore;
    return matchQuery && matchStore;
  });

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <ScreenBackButton to="/manager" light className="mb-3" />
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{user?.blockName ?? user?.block ?? "Блок не назначен"}</p>
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
          {loading ? "Загрузка..." : `${filtered.length} сотрудников`}
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Загрузка сотрудников...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Нет сотрудников для отображения
            </div>
          ) : (
            filtered.map((emp, i) => {
              const status = statusBadge[emp.status as keyof typeof statusBadge] || statusBadge.off;
              return (
                <button
                  key={emp.id}
                  onClick={() => navigate(`/manager/employees/${emp.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}
                >
                  <Avatar name={emp.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{emp.name}</p>
                    <p style={{ color: "#94A3B8", fontSize: 12 }}>{emp.store || "Не назначена"}</p>
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
