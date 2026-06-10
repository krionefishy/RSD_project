import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { SellingsAPI, type SalesPlanPeriod, type SellingStats } from "../../api/SellingsAPI";
import { SalesPlanDetailSheet } from "../../components/sales/SalesPlanDetailSheet";
import { formatMonthYear } from "../../utils/date";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

function PlanSummaryCard({
  label,
  subtitle,
  stats,
  loading,
  onClick,
}: {
  label: string;
  subtitle: string;
  stats: SellingStats | null;
  loading: boolean;
  onClick: () => void;
}) {
  const percent = stats?.percent ?? 0;
  const color = percent >= 100 ? "#22C55E" : percent >= 70 ? "#2E7D32" : "#F59E0B";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left"
      style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p style={{ color: "#64748B", fontSize: 12 }}>{subtitle}</p>
          <p style={{ color: "#1E293B", fontSize: 16, fontWeight: 600 }}>{label}</p>
        </div>
        <ChevronRight size={20} color="#94A3B8" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p style={{ color: color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {loading ? "—" : `${percent}%`}
          </p>
          <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>выполнено</p>
        </div>
        <div className="text-right">
          <p style={{ color: "#64748B", fontSize: 11 }}>Факт / план</p>
          <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>
            {loading
              ? "—"
              : `${(stats?.fact ?? 0).toLocaleString("ru")} / ${(stats?.plan ?? 0).toLocaleString("ru")} ₽`}
          </p>
          {!loading && stats?.bonus != null && (
            <p style={{ color: "#2E7D32", fontSize: 12, marginTop: 4 }}>
              Бонус {stats.bonus.toLocaleString("ru")} ₽
            </p>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ background: "#E2E8F0" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%`, background: color }}
        />
      </div>
    </button>
  );
}

export default function SalesPage() {
  const [dailyStats, setDailyStats] = useState<SellingStats | null>(null);
  const [periodicStats, setPeriodicStats] = useState<SellingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailPeriod, setDetailPeriod] = useState<SalesPlanPeriod | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [daily, periodic] = await Promise.all([
          SellingsAPI.getStats("daily", controller.signal),
          SellingsAPI.getStats("periodic", controller.signal),
        ]);
        setDailyStats(daily);
        setPeriodicStats(periodic);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить статистику продаж"));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const detailStats = detailPeriod === "daily" ? dailyStats : detailPeriod === "periodic" ? periodicStats : null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{formatMonthYear()}</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Мои продажи</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 6 }}>
          Нажмите на карточку для детализации и ступеней бонуса
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <PlanSummaryCard
          label="План на сегодня"
          subtitle="Дневной стакан"
          stats={dailyStats}
          loading={loading}
          onClick={() => setDetailPeriod("daily")}
        />
        <PlanSummaryCard
          label="План на период"
          subtitle="Месячный стакан"
          stats={periodicStats}
          loading={loading}
          onClick={() => setDetailPeriod("periodic")}
        />
      </div>

      {detailPeriod && detailStats && (
        <SalesPlanDetailSheet
          period={detailPeriod}
          stats={detailStats}
          onClose={() => setDetailPeriod(null)}
        />
      )}
    </div>
  );
}
