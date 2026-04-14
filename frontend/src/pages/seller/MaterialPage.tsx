import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Play, CheckCircle } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { sectionMaterials, materialContent } from "../../mock/mockData";

export default function MaterialPage() {
  const { materialId } = useParams<{ sectionId: string; materialId: string }>();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const allMaterials = Object.values(sectionMaterials).flat();
  const material = allMaterials.find((m) => m.id === materialId);
  const content = materialContent[materialId as keyof typeof materialContent];

  if (!material) return null;

  const markDone = () => {
    setDone(true);
    setTimeout(() => navigate(-1), 1000);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader title={material.title} showBack white />

      <div className="flex-1 overflow-auto" style={{ paddingBottom: 80 }}>
        {/* Meta */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
          <span
            className="px-2 py-1 rounded-md"
            style={{
              background: material.type === "video" ? "#F5F3FF" : material.type === "document" ? "#ECFEFF" : "#F0FDF4",
              color: material.type === "video" ? "#7C3AED" : material.type === "document" ? "#0891B2" : "#059669",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {material.type === "video" ? "Видео" : material.type === "document" ? "Документ" : "Статья"}
          </span>
          <span style={{ color: "#94A3B8", fontSize: 12 }}>{material.duration}</span>
          {material.status === "done" && (
            <span className="ml-auto flex items-center gap-1" style={{ color: "#22C55E", fontSize: 12, fontWeight: 500 }}>
              <CheckCircle size={13} /> Пройден
            </span>
          )}
        </div>

        {/* Video placeholder */}
        {material.type === "video" && (
          <div className="mx-4 mt-4 rounded-2xl overflow-hidden">
            {showVideo ? (
              <div
                className="w-full flex items-center justify-center"
                style={{ background: "#1E293B", height: 200 }}
              >
                <div className="text-center">
                  <Play size={40} color="#fff" />
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 8 }}>
                    Видеоплеер (демо)
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full flex flex-col items-center justify-center gap-2"
                style={{ background: "#1E293B", height: 200 }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  <Play size={24} color="#fff" fill="#fff" />
                </div>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  {content?.videoTitle || "Нажмите для просмотра"}
                </p>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-4 py-4">
          {content ? (
            <div>
              {content.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={i} style={{ color: "#1E293B", fontSize: 18, fontWeight: 700, marginBottom: 10, marginTop: i > 0 ? 16 : 0 }}>
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={i} style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 8, marginTop: 14 }}>
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("- **")) {
                  const parts = line.replace("- **", "").split("** — ");
                  return (
                    <div key={i} className="flex gap-2 mb-2 ml-2">
                      <span style={{ color: "#1A56DB", fontSize: 14 }}>•</span>
                      <p style={{ color: "#374151", fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{parts[0]}</span>
                        {parts[1] ? ` — ${parts[1]}` : ""}
                      </p>
                    </div>
                  );
                }
                if (line.match(/^\d+\./)) {
                  return (
                    <div key={i} className="flex gap-2 mb-2 ml-2">
                      <span style={{ color: "#1A56DB", fontSize: 14, fontWeight: 600, minWidth: 20 }}>
                        {line.split(".")[0]}.
                      </span>
                      <p style={{ color: "#374151", fontSize: 14 }}>{line.replace(/^\d+\.\s/, "")}</p>
                    </div>
                  );
                }
                if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
                return (
                  <p key={i} style={{ color: "#374151", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                    {line}
                  </p>
                );
              })}
            </div>
          ) : (
            <div>
              <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7 }}>
                Добро пожаловать в раздел «{material.title}». Этот материал поможет вам освоить ключевые навыки работы в торговой точке.
              </p>
              <div className="mt-4 p-4 rounded-xl" style={{ background: "#EFF6FF" }}>
                <p style={{ color: "#1A56DB", fontSize: 13, fontWeight: 600 }}>💡 Ключевые моменты</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {["Изучите теоретическую часть", "Посмотрите примеры из практики", "Выполните практические задания", "Пройдите проверочный тест"].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: "#1A56DB" }}>•</span>
                      <span style={{ color: "#374151", fontSize: 13 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom button */}
      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto px-4 pb-4 pt-3"
        style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}
      >
        {done ? (
          <div
            className="h-12 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#F0FDF4" }}
          >
            <CheckCircle size={20} color="#22C55E" />
            <span style={{ color: "#16A34A", fontWeight: 600, fontSize: 15 }}>Отмечено как пройденное!</span>
          </div>
        ) : (
          <button
            onClick={markDone}
            className="w-full h-12 rounded-[10px] flex items-center justify-center"
            style={{ background: "#22C55E", color: "#fff", fontSize: 15, fontWeight: 600 }}
          >
            Отметить как пройденное ✓
          </button>
        )}
      </div>
    </div>
  );
}
