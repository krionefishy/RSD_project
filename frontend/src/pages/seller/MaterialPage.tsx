import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckCircle, ExternalLink, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../../components/AppHeader";
import { MarkdownRenderer } from "../../components/markdown/MarkdownRenderer";
import { extractEmbeddedAttachmentIds } from "../../components/markdown/markdownUtils";
import { PageLoader } from "../../components/PageLoader";
import { APIError } from "../../api/APIClient";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { Material } from "../../types/knowledge";
import { isPdfOnlyMaterial, isImageAttachmentFormat } from "../../utils/knowledgeMaterials";

export default function MaterialPage() {
  const { sectionId, materialId } = useParams<{ sectionId: string; materialId: string }>();
  const navigate = useNavigate();
  const courseId = Number(sectionId);
  const materialIdNum = Number(materialId);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!Number.isFinite(courseId) || !Number.isFinite(materialIdNum)) {
      setError("Некорректный идентификатор материала");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    KnowledgeAPI.getMaterial(materialIdNum, courseId)
      .then((result) => {
        if (!cancelled) {
          setMaterial(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось загрузить материал";
        setError(message);
        setLoading(false);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, materialIdNum]);

  useEffect(() => {
    if (!material || material.attachments.length === 0) {
      setPdfUrl(null);
      setAttachmentUrls({});
      return;
    }
    let cancelled = false;
    KnowledgeAPI.resolveMaterialAttachments(material.id, courseId, material.attachments.map((item) => item.id))
      .then((items) => {
        if (!cancelled) {
          const urls = Object.fromEntries(items.map((item) => [item.attachmentId, item.url]));
          const pdfAttachment = material.attachments.find((item) => item.format.toLowerCase() === "pdf");
          setAttachmentUrls(urls);
          setPdfUrl(pdfAttachment ? urls[pdfAttachment.id] ?? null : null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось открыть вложения";
        toast.error(message);
        setPdfUrl(null);
        setAttachmentUrls({});
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, material]);

  const markDone = async () => {
    if (!material || submitting) return;
    setSubmitting(true);
    try {
      await KnowledgeAPI.completeMaterial(courseId, material.id);
      setMaterial((prev) => (prev ? { ...prev, isCompleted: true } : prev));
      toast.success("Материал отмечен как пройденный");
      setTimeout(() => navigate(`/seller/knowledge/${courseId}`, { replace: true }), 800);
    } catch (err) {
      const message = err instanceof APIError ? err.message : "Не удалось отметить материал";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader fullScreen message="Загрузка материала..." />;
  }

  if (error || !material) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
        <AppHeader title="Материал" showBack white />
        <div className="px-4 py-8 text-center">
          <p style={{ color: "#DC2626", fontSize: 14 }}>{error ?? "Материал не найден"}</p>
        </div>
      </div>
    );
  }

  const embeddedAttachmentIds = new Set(extractEmbeddedAttachmentIds(material.text));

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader title={material.name} showBack white />

      <div className="flex-1 overflow-auto" style={{ paddingBottom: 24 }}>
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}
        >
          <span
            className="px-2 py-1 rounded-md"
            style={{
              background: "#F0FDF4",
              color: "#059669",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {material.category || "Материал"}
          </span>
          {material.description && (
            <span style={{ color: "#64748B", fontSize: 12 }} className="truncate">
              {material.description}
            </span>
          )}
        </div>

        <div className="px-4 py-4">
          {isPdfOnlyMaterial(material) ? (
            pdfUrl ? (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <iframe
                  src={pdfUrl}
                  title={material.name}
                  className="w-full"
                  style={{ height: "70vh", border: "none" }}
                />
                <div className="px-4 py-3 border-t border-slate-100">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: "#2E7D32" }}
                  >
                    <ExternalLink size={14} />
                    Открыть PDF отдельно
                  </a>
                </div>
              </div>
            ) : (
              <p style={{ color: "#64748B", fontSize: 14 }}>PDF загружается...</p>
            )
          ) : material.text.trim() ? (
            <MarkdownRenderer
              content={material.text}
              className="space-y-4"
              attachmentUrls={attachmentUrls}
              emptyFallback={
                <p style={{ color: "#64748B", fontSize: 14 }}>
                  Контент для этого материала появится позже.
                </p>
              }
            />
          ) : (
            <p style={{ color: "#64748B", fontSize: 14 }}>
              Контент для этого материала появится позже.
            </p>
          )}
        </div>

        {material.attachments.length > 0 && (
          <div className="px-4 pb-4">
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Вложения
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              {material.attachments.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderBottom: i < material.attachments.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#F1F5F9" }}
                  >
                    <Paperclip size={16} color="#64748B" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }} className="truncate">
                      {a.name}
                    </p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>
                      {a.format.toUpperCase()}
                      {embeddedAttachmentIds.has(a.id) ? " · используется в тексте" : ""}
                    </p>
                  </div>
                  {attachmentUrls[a.id] && (
                    <a
                      href={attachmentUrls[a.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: "#2E7D32" }}
                    >
                      <ExternalLink size={12} />
                      Открыть
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {material.attachments.some(
          (item) => isImageAttachmentFormat(item.format) && !embeddedAttachmentIds.has(item.id),
        ) && (
          <div className="px-4 pb-4">
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              Изображения
            </p>
            <div className="grid grid-cols-1 gap-3">
              {material.attachments
                .filter(
                  (item) => isImageAttachmentFormat(item.format) && !embeddedAttachmentIds.has(item.id),
                )
                .map((item) =>
                  attachmentUrls[item.id] ? (
                    <a
                      key={item.id}
                      href={attachmentUrls[item.id]}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-2xl"
                      style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    >
                      <img
                        src={attachmentUrls[item.id]}
                        alt={item.name}
                        className="w-full object-cover"
                        style={{ maxHeight: 360 }}
                      />
                    </a>
                  ) : null,
                )}
            </div>
          </div>
        )}

        <div className="px-4 pb-5">
          {material.isCompleted ? (
            <div className="h-12 rounded-[10px] flex items-center justify-center gap-2" style={{ background: "#F0FDF4" }}>
              <CheckCircle size={20} color="#22C55E" />
              <span style={{ color: "#16A34A", fontWeight: 600, fontSize: 15 }}>Материал пройден</span>
            </div>
          ) : (
            <button
              onClick={() => void markDone()}
              disabled={submitting}
              className="w-full h-12 rounded-[10px] flex items-center justify-center"
              style={{
                background: submitting ? "#A5D6A7" : "#22C55E",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {submitting ? "Сохранение..." : "Пройти материал"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
