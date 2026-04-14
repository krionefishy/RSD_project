import { useNavigate, useParams } from "react-router";
import { FileText, Video, File, CheckCircle, Clock, Circle } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { knowledgeSections, sectionMaterials } from "../../mock/mockData";
import { Material } from "../../types/data";

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText size={18} color="#64748B" />,
  video: <Video size={18} color="#7C3AED" />,
  document: <File size={18} color="#0891B2" />,
};

const typeLabels: Record<string, string> = {
  text: "Статья",
  video: "Видео",
  document: "Документ",
};

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  done: { icon: <CheckCircle size={16} color="#22C55E" />, label: "Пройден", color: "#22C55E" },
  "in-progress": { icon: <Clock size={16} color="#1A56DB" />, label: "В процессе", color: "#1A56DB" },
  "not-started": { icon: <Circle size={16} color="#CBD5E1" />, label: "Не начат", color: "#94A3B8" },
};

export default function KnowledgeSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  const section = knowledgeSections.find((s) => s.id === sectionId);
  const materials: Material[] = sectionMaterials[sectionId || ""] || [];

  if (!section) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title={section.title} showBack backTo="/seller/knowledge" white />

      {/* Section stats */}
      <div
        className="px-4 py-4 flex items-center gap-4"
        style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}
      >
        <div className="text-center flex-1">
          <p style={{ color: "#1E293B", fontSize: 20, fontWeight: 700 }}>{materials.length}</p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Материалов</p>
        </div>
        <div className="w-px h-10" style={{ background: "#E2E8F0" }} />
        <div className="text-center flex-1">
          <p style={{ color: "#22C55E", fontSize: 20, fontWeight: 700 }}>
            {materials.filter((m) => m.status === "done").length}
          </p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Пройдено</p>
        </div>
        <div className="w-px h-10" style={{ background: "#E2E8F0" }} />
        <div className="text-center flex-1">
          <p style={{ color: section.color, fontSize: 20, fontWeight: 700 }}>{section.progress}%</p>
          <p style={{ color: "#64748B", fontSize: 11 }}>Прогресс</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3" style={{ background: "#fff" }}>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${section.progress}%`, background: section.color }}
          />
        </div>
      </div>

      {/* Materials list */}
      <div className="px-4 pt-3 pb-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>Материалы раздела</p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {materials.map((m, i) => {
            const status = statusConfig[m.status];
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/seller/knowledge/${sectionId}/${m.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                style={{ borderBottom: i < materials.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#F8FAFC" }}
                >
                  {typeIcons[m.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color: "#1E293B",
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: 1.3,
                      marginBottom: 3,
                    }}
                  >
                    {m.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{typeLabels[m.type]}</span>
                    <span style={{ color: "#CBD5E1", fontSize: 11 }}>·</span>
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>{m.duration}</span>
                  </div>
                  {m.status === "in-progress" && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${m.progress}%`, background: section.color }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {status.icon}
                  <span style={{ color: status.color, fontSize: 10, fontWeight: 500 }}>{status.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
