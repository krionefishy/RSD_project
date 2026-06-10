import { X } from "lucide-react";
import { ProgressCircle } from "../ProgressCircle";
import type { SalesPlanPeriod, SellingStats } from "../../api/SellingsAPI";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatMonthYear } from "../../utils/date";

interface SalesPlanDetailSheetProps {
  period: SalesPlanPeriod;
  stats: SellingStats;
  onClose: () => void;
}

export function SalesPlanDetailSheet({ period, stats, onClose }: SalesPlanDetailSheetProps) {
  const color = stats.percent >= 100 ? "#22C55E" : stats.percent >= 70 ? "#2E7D32" : "#F59E0B";
  const title = period === "daily" ? "План на сегодня" : "План на период";
  const subtitle = period === "daily" ? "Дневной план" : formatMonthYear();

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg px-3 py-2" style={{ background: "#1E293B" }}>
          <p style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>{label}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.name === "fact" ? "#fff" : "#94A3B8", fontSize: 12 }}>
              {p.name === "fact" ? "Факт" : "План"}: {Number(p.value).toLocaleString("ru")} ₽
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-center items-end"
      style={{ background: "rgba(15, 23, 42, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-y-auto max-h-[85vh] mb-2 mx-auto"
        style={{ background: "#F8FAFC" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 pt-5 pb-4 flex items-start justify-between"
          style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
        >
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{subtitle}</p>
            <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 2 }}>{title}</h2>
            {stats.productName && (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>{stats.productName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.16)" }}
            aria-label="Закрыть"
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-3">
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-5">
              <ProgressCircle value={stats.percent} size={100} strokeWidth={10} color={color}>
                <div className="text-center">
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>{stats.percent}%</span>
                </div>
              </ProgressCircle>
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>Факт</p>
                  <p style={{ color: "#1E293B", fontSize: 17, fontWeight: 700 }}>
                    {stats.fact.toLocaleString("ru")} ₽
                  </p>
                </div>
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>План</p>
                  <p style={{ color: "#94A3B8", fontSize: 14 }}>{stats.plan.toLocaleString("ru")} ₽</p>
                </div>
                {stats.targetQuantity != null && (
                  <div>
                    <p style={{ color: "#64748B", fontSize: 12 }}>Количество</p>
                    <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
                      {stats.factQuantity ?? 0} / {stats.targetQuantity} шт.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {stats.bonusRules && stats.bonusRules.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                Ступени бонуса за единицу
              </p>
              <p style={{ color: "#64748B", fontSize: 12, marginBottom: 12 }}>
                Бонус начисляется по диапазонам проданного количества (см. ТЗ мотивации v1.1).
              </p>
              <div className="flex flex-col gap-2">
                {stats.bonusRules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: "#F8FAFC" }}
                  >
                    <span style={{ color: "#374151", fontSize: 13 }}>
                      {rule.fromQuantity}
                      {rule.toQuantity != null ? `–${rule.toQuantity}` : "+"} шт.
                    </span>
                    <span style={{ color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>
                      {rule.bonusPerUnit} ₽/шт.
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ color: "#64748B", fontSize: 11, marginTop: 12 }}>
                Пример: при 27 чашках — 10×5 ₽ + 5×10 ₽ + 2×15 ₽ = 120 ₽ бонуса за кофе.
              </p>
            </div>
          )}

          <div
            className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #2E7D32, #1B5E20)", boxShadow: "0 4px 12px rgba(46,125,50,0.25)" }}
          >
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Расчётная мотивация</p>
            <p style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginTop: 2 }}>
              {stats.bonus.toLocaleString("ru")} ₽
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>
              При выполнении плана {stats.percent}%
            </p>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              {period === "daily" ? "Динамика за 7 дней" : "По неделям"}
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats.chart} barGap={4}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="plan" fill="#E2E8F0" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="fact" fill={color} radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats.positions.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>По позициям</p>
              <div className="flex flex-col gap-3">
                {stats.positions.map((pos, i) => {
                  const pct = pos.plan > 0 ? Math.round((pos.fact / pos.plan) * 100) : 0;
                  const c = pct >= 100 ? "#22C55E" : pct >= 70 ? "#2E7D32" : "#F59E0B";
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{pos.name}</span>
                        <span style={{ color: c, fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
