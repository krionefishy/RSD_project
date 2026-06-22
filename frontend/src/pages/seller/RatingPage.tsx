import { useEffect, useState } from "react";
import { Avatar } from "../../components/Avatar";
import { SellingsAPI, MotivationRating } from "../../api/SellingsAPI";
import { ReportsAPI, LearningRatingItem } from "../../api/ReportsAPI";
import { useApp } from "../../context/AppContext";
import { formatMonthYear } from "../../utils/date";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

interface RatingDisplay {
  myPosition: number;
  change: number;
  myValue: string;
  total: number;
  list: Array<{
    rank: number;
    userId: string;
    name: string;
    store: string;
    value: string;
    isMe: boolean;
  }>;
}

const EMPTY: RatingDisplay = { myPosition: 0, change: 0, myValue: "—", total: 0, list: [] };

function mapLearningItems(items: LearningRatingItem[], currentUserId: string): RatingDisplay {
  const me = items.find((i) => i.userId === currentUserId);
  return {
    myPosition: me?.rank ?? 0,
    change: 0,
    myValue: me?.metricDisplay ?? "—",
    total: items.length,
    list: items.map((i) => ({
      rank: i.rank,
      userId: i.userId,
      name: i.userName,
      store: "",
      value: i.metricDisplay,
      isMe: i.userId === currentUserId,
    })),
  };
}

export default function RatingPage() {
  const { user } = useApp();
  const [tab, setTab] = useState<"sales" | "learning">("sales");
  const [salesRating, setSalesRating] = useState<MotivationRating | null>(null);
  const [learningDisplay, setLearningDisplay] = useState<RatingDisplay | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [learningLoading, setLearningLoading] = useState(true);

  // Sales rating (existing SellingsAPI)
  useEffect(() => {
    const controller = new AbortController();
    SellingsAPI.getMotivation(controller.signal)
      .then((data) => setSalesRating(data))
      .catch((error) => {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить рейтинг продаж"));
      })
      .finally(() => setSalesLoading(false));
    return () => controller.abort();
  }, []);

  // Learning rating (real API /ratings/learning)
  useEffect(() => {
    let cancelled = false;
    setLearningLoading(true);
    ReportsAPI.getLearningRating()
      .then((dto) => {
        if (cancelled) return;
        if (dto && user) {
          setLearningDisplay(mapLearningItems(dto.items, user.id));
        } else {
          setLearningDisplay(EMPTY);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLearningDisplay(EMPTY);
          if (!isAbortError(error)) {
            toast.error(getErrorMessage(error, "Не удалось загрузить рейтинг обучения"));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLearningLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const loading = tab === "sales" ? salesLoading : learningLoading;
  const data: RatingDisplay =
    tab === "sales"
      ? salesRating
        ? salesRating.sales
        : EMPTY
      : (learningDisplay ?? EMPTY);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{formatMonthYear()}</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Рейтинг</h1>

        {/* Tabs */}
        <div
          className="flex mt-4 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {(["sales", "learning"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5"
              style={{
                background: tab === t ? "rgba(255,255,255,0.25)" : "transparent",
                color: "#fff",
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                borderRadius: 10,
              }}
            >
              {t === "sales" ? "По продажам" : "По обучению"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* My position card */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
            boxShadow: "0 4px 16px rgba(26,86,219,0.3)",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 8 }}>Моя позиция</p>
          <div className="flex items-center gap-4">
            <span style={{ color: "#fff", fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
              #{loading ? "—" : data.myPosition || "—"}
            </span>
            <div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                {loading
                  ? "Загрузка..."
                  : `Среди ${data.total} ${tab === "sales" ? "продавцов блока" : "сотрудников"}`}
              </p>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {loading ? "—" : data.myValue}
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>
              {tab === "sales" ? "Топ продавцов блока" : "Топ по обучению"}
            </p>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Загрузка рейтинга...
            </div>
          ) : data.list.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Нет данных для отображения
            </div>
          ) : (
            data.list.map((item, i) => {
              const isTop3 = item.rank <= 3;
              return (
                <div
                  key={item.rank}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: item.isMe ? "#E8F5E9" : "#fff",
                    borderBottom: i < data.list.length - 1 ? "1px solid #F1F5F9" : "none",
                    borderLeft: item.isMe ? "3px solid #2E7D32" : "3px solid transparent",
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {isTop3 ? (
                      <span style={{ fontSize: 20 }}>{medals[item.rank - 1]}</span>
                    ) : (
                      <span
                        style={{
                          color: item.isMe ? "#2E7D32" : "#94A3B8",
                          fontSize: 14,
                          fontWeight: item.isMe ? 700 : 400,
                        }}
                      >
                        {item.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar name={item.name} size={36} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: "#1E293B",
                        fontSize: 14,
                        fontWeight: item.isMe ? 600 : 400,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.name}
                      {item.isMe && (
                        <span
                          className="ml-1.5 px-1.5 py-0.5 rounded"
                          style={{ background: "#2E7D32", color: "#fff", fontSize: 9, fontWeight: 700 }}
                        >
                          Я
                        </span>
                      )}
                    </p>
                    {item.store && (
                      <p style={{ color: "#94A3B8", fontSize: 11 }}>{item.store}</p>
                    )}
                  </div>

                  {/* Value */}
                  <span
                    style={{
                      color: item.isMe ? "#2E7D32" : "#1E293B",
                      fontSize: 13,
                      fontWeight: item.isMe ? 700 : 500,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
