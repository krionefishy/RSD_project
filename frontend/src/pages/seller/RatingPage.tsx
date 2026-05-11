import { useState } from "react";
import { Avatar } from "../../components/Avatar";
import { ratingData } from "../../mock/mockData";

export default function RatingPage() {
  const [tab, setTab] = useState<"sales" | "learning">("sales");
  const data = tab === "sales" ? ratingData.sales : ratingData.learning;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Апрель 2026</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>Рейтинг</h1>

        {/* Tabs */}
        <div
          className="flex mt-4 rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {["sales", "learning"].map((t) => (
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
              #{data.myPosition}
            </span>
            <div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                Среди {data.total} {tab === "sales" ? "продавцов блока" : "сотрудников"}
              </p>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {data.myValue}
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
          {data.list.map((item, i) => {
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
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{item.store}</p>
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
          })}
        </div>
      </div>
    </div>
  );
}
