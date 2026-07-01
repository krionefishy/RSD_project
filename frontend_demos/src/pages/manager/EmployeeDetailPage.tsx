import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { ProgressCircle } from "../../components/ProgressCircle";
import { UserAPI } from "../../api/UserAPI";
import { PersonnelAPI } from "../../api/PersonnelAPI";
import { AppUser } from "../../types/user";
import { SellingsAPI, SellingStats } from "../../api/SellingsAPI";
import { KnowledgeAPI, type Course } from "../../api/KnowledgeAPI";
import { TimesheetCalendar } from "../../components/timesheets/TimesheetCalendar";
import type { TimesheetEntry } from "../../types/profile";
import { monthPeriodQuery } from "../../utils/timesheet";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sales" | "learning" | "schedule">("sales");
  const [employee, setEmployee] = useState<AppUser | null>(null);
  const [stats, setStats] = useState<SellingStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [timesheetTotalHours, setTimesheetTotalHours] = useState("0");
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [timesheetError, setTimesheetError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      if (!employeeId) return;
      try {
        const [userData, statsData] = await Promise.all([
          UserAPI.getUser(employeeId, controller.signal),
          SellingsAPI.getStats(employeeId, controller.signal),
        ]);
        setEmployee(userData);
        setStats(statsData);

        const coursesData = await KnowledgeAPI.listCourses(controller.signal);
        const courseDetails = await Promise.all(
          coursesData.map(c => KnowledgeAPI.getCourse(c.id, controller.signal).catch(() => null))
        );
        setCourses(courseDetails.filter(Boolean) as Course[]);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить данные сотрудника"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId || tab !== "schedule") return;
    const controller = new AbortController();
    setTimesheetLoading(true);
    setTimesheetError(null);
    PersonnelAPI.getEmployeeTimesheet(employeeId, monthPeriodQuery(monthDate), controller.signal)
      .then((data) => {
        setTimesheetEntries(data.items);
        setTimesheetTotalHours(data.totalHours);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setTimesheetError(getErrorMessage(error, "Не удалось загрузить график"));
        setTimesheetEntries([]);
        setTimesheetTotalHours("0");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTimesheetLoading(false);
      });
    return () => controller.abort();
  }, [employeeId, tab, monthDate]);

  if (!employeeId) return null;

  const salesPercent = stats?.percent ?? 0;
  const learningPercent = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.userPointsByCourse || 0), 0) / courses.length)
    : 0;
  const salesColor = salesPercent >= 100 ? "#22C55E" : salesPercent >= 70 ? "#2E7D32" : "#F59E0B";
  const learningColor = learningPercent >= 90 ? "#22C55E" : learningPercent >= 70 ? "#2E7D32" : "#F59E0B";

  const salesChartData = stats?.chart ?? [
    { day: "Пн", fact: 0 },
    { day: "Вт", fact: 0 },
    { day: "Ср", fact: 0 },
    { day: "Чт", fact: 0 },
    { day: "Пт", fact: 0 },
    { day: "Сб", fact: 0 },
    { day: "Вс", fact: 0 },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4" style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Сотрудники
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={employee?.name || "?"} size={56} />
          <div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{loading ? "Загрузка..." : employee?.name || "Неизвестно"}</p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{employee?.position || "Продавец"}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{employee?.store || "Точка не назначена"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-3 gap-2 overflow-x-auto" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", scrollbarWidth: "none" }}>
        {(["sales", "learning", "schedule"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-shrink-0 px-4 py-2 rounded-xl"
            style={{
              background: tab === t ? "#2E7D32" : "#F1F5F9",
              color: tab === t ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "sales" ? "Продажи" : t === "learning" ? "Обучение" : "Расписание"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === "sales" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4 flex items-center gap-5" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <ProgressCircle value={loading ? 0 : salesPercent} size={100} strokeWidth={10} color={salesColor}>
                <div className="text-center">
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{loading ? "—" : `${salesPercent}%`}</span>
                </div>
              </ProgressCircle>
              <div>
                <p style={{ color: "#64748B", fontSize: 12 }}>Выполнение плана</p>
                <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 700 }}>{loading ? "—" : `${(stats?.fact ?? 0).toLocaleString("ru")} ₽`}</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>{loading ? "—" : `из ${(stats?.plan ?? 0).toLocaleString("ru")} ₽ плана`}</p>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Продажи за неделю</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={salesChartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString("ru")} ₽`, "Продажи"]} />
                  <Bar dataKey="fact" fill={salesColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "learning" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4 flex items-center gap-5" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <ProgressCircle value={loading ? 0 : learningPercent} size={100} strokeWidth={10} color={learningColor}>
                <div className="text-center">
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{loading ? "—" : `${learningPercent}%`}</span>
                </div>
              </ProgressCircle>
              <div>
                <p style={{ color: "#64748B", fontSize: 12 }}>Прогресс обучения</p>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
                  {loading ? "—" : `${courses.filter(c => c.isCourseCompleted).length} из ${courses.length} курсов`}
                </p>
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  {loading ? "—" : `${courses.filter(c => !c.isCourseCompleted).length} курса в процессе`}
                </p>
              </div>
            </div>
            {loading ? (
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", color: "#64748B" }}>
                Загрузка курсов...
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", color: "#64748B" }}>
                Нет назначенных курсов
              </div>
            ) : (
              courses.map((course) => {
                const completedMaterials = course.materials.filter(m => m.isCompleted).length;
                const totalMaterials = course.materials.length;
                const pct = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
                return (
                  <div key={course.id} className="rounded-xl px-4 py-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{course.name}</span>
                      <span style={{ color: pct >= 70 ? "#22C55E" : "#F59E0B", fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 70 ? "#22C55E" : "#F59E0B" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "schedule" && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>График сотрудника</p>
            <TimesheetCalendar
              entries={timesheetEntries}
              totalHours={timesheetTotalHours}
              loading={timesheetLoading}
              error={timesheetError}
              monthDate={monthDate}
              onMonthChange={setMonthDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
