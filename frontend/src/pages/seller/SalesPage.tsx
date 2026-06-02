import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProgressCircle } from "../../components/ProgressCircle";
import { SellingsAPI, SellingStats } from "../../api/SellingsAPI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAtom } from "jotai";
import { activeTabAtom } from "../../store/atoms";
import { formatMonthYear } from "../../utils/date";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

export default function SalesPage() {
  const [tab, setTab] = useAtom(activeTabAtom);
  const [openAccordion, setOpenAccordion] = useState(false);
  const [stats, setStats] = useState<SellingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStats() {
      try {
        const data = await SellingsAPI.getStats(undefined, controller.signal);
        setStats(data);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить статистику продаж"));
      } finally {
        setLoading(false);
      }
    }
    loadStats();
    return () => controller.abort();
  }, []);

  const data = stats ?? { plan: 0, fact: 0, percent: 0, bonus: 0, chart: [], positions: [] };
  const color = data.percent >= 100 ? "#22C55E" : data.percent >= 70 ? "#2E7D32" : "#F59E0B";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg px-3 py-2" style={{ background: "#1E293B", border: "none" }}>
          <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.name === "fact" ? "#fff" : "#94A3B8", fontSize: 12, fontWeight: p.name === "fact" ? 600 : 400 }}>
              {p.name === "fact" ? "Факт" : "План"}: {Number(p.value).toLocaleString("ru")} ₽
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{formatMonthYear()}</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Мои продажи</h1>

        {/* Tabs */}
        <div
          className="flex mt-4 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {["daily", "periodic"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className="flex-1 py-2.5"
              style={{
                background: tab === t ? "rgba(255,255,255,0.25)" : "transparent",
                color: "#fff",
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                borderRadius: 10,
              }}
            >
              {t === "daily" ? "За сегодня" : "За период"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Main plan/fact card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-5">
            <ProgressCircle value={loading ? 0 : data.percent} size={120} strokeWidth={12} color={color}>
              <div className="text-center">
                <span style={{ fontSize: 24, fontWeight: 800, color: "#1E293B" }}>{loading ? "—" : `${data.percent}%`}</span>
                <p style={{ color: "#94A3B8", fontSize: 10, marginTop: 1 }}>выполнено</p>
              </div>
            </ProgressCircle>
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>Факт</p>
                  <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 700 }}>
                    {loading ? "—" : `${data.fact.toLocaleString("ru")} ₽`}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>План</p>
                  <p style={{ color: "#94A3B8", fontSize: 15, fontWeight: 500 }}>
                    {loading ? "—" : `${data.plan.toLocaleString("ru")} ₽`}
                  </p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg"
                  style={{ background: color + "15" }}
                >
                  <p style={{ color: "#64748B", fontSize: 11 }}>Осталось</p>
                  <p style={{ color, fontSize: 14, fontWeight: 600 }}>
                    {loading ? "—" : `${Math.max(data.plan - data.fact, 0).toLocaleString("ru")} ₽`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {tab === "daily" ? "Динамика за 7 дней" : "По неделям"}
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={loading ? [] : data.chart} barGap={4}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="plan" fill="#E2E8F0" radius={[4, 4, 0, 0]} maxBarSize={16} />
              <Bar dataKey="fact" fill={color} radius={[4, 4, 0, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "#E2E8F0" }} />
              <span style={{ color: "#94A3B8", fontSize: 11 }}>План</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span style={{ color: "#94A3B8", fontSize: 11 }}>Факт</span>
            </div>
          </div>
        </div>

        {/* Motivation card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, #2E7D32, #1B5E20)", boxShadow: "0 4px 12px rgba(26,86,219,0.3)" }}
        >
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Расчётная мотивация</p>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginTop: 2 }}>
            {loading ? "—" : `${data.bonus.toLocaleString("ru")} ₽`}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
            При текущем выполнении плана ({loading ? "—" : `${data.percent}%`})
          </p>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(data.percent, 100)}%`, background: "rgba(255,255,255,0.8)" }}
            />
          </div>
        </div>

        {/* Positions accordion */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={() => setOpenAccordion(!openAccordion)}
            className="w-full flex items-center justify-between px-4 py-4"
          >
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>Детализация по позициям</p>
            {openAccordion ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </button>
          {openAccordion && (
            <div style={{ borderTop: "1px solid #F1F5F9" }}>
              {loading ? (
                <div className="px-4 py-3 text-center" style={{ color: "#64748B", fontSize: 13 }}>
                  Загрузка данных...
                </div>
              ) : data.positions.length === 0 ? (
                <div className="px-4 py-3 text-center" style={{ color: "#64748B", fontSize: 13 }}>
                  Нет данных по позициям
                </div>
              ) : (
                data.positions.map((pos, i) => {
                  const pct = Math.round((pos.fact / pos.plan) * 100);
                  const c = pct >= 100 ? "#22C55E" : pct >= 70 ? "#2E7D32" : "#F59E0B";
                  return (
                    <div
                      key={i}
                      className="px-4 py-3"
                      style={{ borderBottom: i < data.positions.length - 1 ? "1px solid #F1F5F9" : "none" }}
                    >
                      <div className="flex justify-between mb-1">
                        <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{pos.name}</span>
                        <span style={{ color: c, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span style={{ color: "#94A3B8", fontSize: 11 }}>
                          {pos.fact.toLocaleString("ru")} / {pos.plan.toLocaleString("ru")} ₽
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%`, background: c }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
