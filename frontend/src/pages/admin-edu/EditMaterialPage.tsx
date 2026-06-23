import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { MarkdownEditor } from "../../components/markdown/MarkdownEditor";
import type { Material } from "../../types/knowledge";
import { getErrorMessage } from "../../utils/errors";
import {
  isPdfOnlyMaterial,
  MATERIAL_ATTACHMENT_ACCEPT,
  PDF_ONLY_ATTACHMENT_ACCEPT,
} from "../../utils/knowledgeMaterials";
import { ConfirmDialog } from "./manage/ConfirmDialog";

export default function EditMaterialPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = Number(materialId);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", category: "", description: "", text: "" });

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const items = await KnowledgeAPI.listMaterials();
        const found = items.find((item) => item.id === id);
        if (!found) {
          toast.error("Материал не найден");
          navigate("/admin-edu/manage");
          return;
        }
        setMaterial(found);
        setForm({
          name: found.name,
          category: found.category,
          description: found.description ?? "",
          text: found.text,
        });
      } catch (error) {
        toast.error(getErrorMessage(error, "Не удалось загрузить материал"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id, navigate]);

  useEffect(() => {
    if (!material || !isPdfOnlyMaterial(material)) {
      setPdfUrl(null);
      return;
    }
    let cancelled = false;
    KnowledgeAPI.resolveAdminMaterialAttachments(material.id, material.attachments.map((item) => item.id))
      .then((items) => {
        if (!cancelled) {
          setPdfUrl(items[0]?.url ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPdfUrl(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [material]);

  const handleSave = async () => {
    if (!material) return;
    setSaving(true);
    try {
      const updated = await KnowledgeAPI.updateMaterial(material.id, {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        text: pdfMaterial ? "" : form.text,
      });
      setMaterial(updated);
      toast.success("Материал сохранён");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить материал"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!material) return;
    try {
      const attachment = await KnowledgeAPI.uploadMaterialAttachment(material.id, file);
      setMaterial((prev) =>
        prev ? { ...prev, attachments: [...prev.attachments, attachment] } : prev,
      );
      toast.success("Вложение загружено");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить вложение"));
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!material) return;
    try {
      await KnowledgeAPI.deleteMaterialAttachment(material.id, attachmentId);
      setMaterial((prev) =>
        prev
          ? { ...prev, attachments: prev.attachments.filter((item) => item.id !== attachmentId) }
          : prev,
      );
      toast.success("Вложение удалено");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить вложение"));
    }
  };

  const handleDelete = async () => {
    if (!material) return;
    setDeleting(true);
    try {
      await KnowledgeAPI.deleteMaterial(material.id);
      toast.success("Материал удалён");
      navigate("/admin-edu/manage");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить материал"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !material) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">{loading ? "Загрузка..." : "Материал не найден"}</p>
      </div>
    );
  }

  const pdfMaterial = isPdfOnlyMaterial(material);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="px-4 pt-4 pb-5 bg-gradient-to-br from-[#2E7D32] to-[#1B5E20]">
        <button
          onClick={() => navigate("/admin-edu/manage")}
          className="flex items-center gap-1 mb-3 text-white/80 text-sm"
        >
          <ChevronLeft size={18} />
          Назад
        </button>
        <h1 className="text-white text-xl font-bold">Редактирование материала</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl bg-white shadow-sm p-4 flex flex-col gap-3 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Название материала</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11 rounded-lg border px-3 text-sm"
                placeholder="Название"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Категория</span>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="h-11 rounded-lg border px-3 text-sm"
                placeholder="Категория"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Краткое описание</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="rounded-lg border px-3 py-2 text-sm resize-none"
              placeholder="Описание"
            />
          </label>
          {pdfMaterial ? (
            <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
              Для PDF-материала текстовый контент отключён. Материал отображается из единственного PDF-вложения.
            </div>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Содержание материала</span>
              <MarkdownEditor
                value={form.text}
                onChange={(text) => setForm((prev) => ({ ...prev, text }))}
                placeholder="Содержание (Markdown)"
              />
            </label>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-11 flex-1 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium"
            >
              <Trash2 size={16} />
              Удалить материал
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
            <p className="font-semibold text-slate-800 text-sm">Вложения</p>
            <button
              type="button"
              className="text-xs text-[#2E7D32] font-medium max-sm:w-full max-sm:rounded-lg max-sm:bg-emerald-50 max-sm:px-3 max-sm:py-2 max-sm:text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              Загрузить
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={pdfMaterial ? PDF_ONLY_ATTACHMENT_ACCEPT : MATERIAL_ATTACHMENT_ACCEPT}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
          {material.attachments.length === 0 ? (
            <p className="text-xs text-slate-400">Нет вложений</p>
          ) : (
            material.attachments.map((att) => (
              <div key={att.id} className="flex items-start justify-between gap-2 border-t border-slate-50 py-2">
                <span className="break-all text-sm text-slate-700">
                  {att.name}.{att.format}
                </span>
                <button type="button" className="flex-shrink-0" onClick={() => void handleDeleteAttachment(att.id)}>
                  <Trash2 size={14} color="#DC2626" />
                </button>
              </div>
            ))
          )}
          {pdfMaterial && material.attachments.length > 0 && (
            <p className="text-xs text-slate-500 mt-3">
              Чтобы заменить PDF, сначала удалите текущее вложение, затем загрузите новый файл.
            </p>
          )}
        </div>

        {pdfMaterial && pdfUrl && (
          <div className="rounded-2xl bg-white shadow-sm p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
              <p className="text-xs font-medium text-slate-500">Предпросмотр PDF</p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32]"
              >
                <ExternalLink size={12} />
                Открыть отдельно
              </a>
            </div>
            <iframe
              src={pdfUrl}
              title={material.name}
              className="w-full rounded-lg"
              style={{ height: "min(70vh, 680px)", border: "1px solid #E2E8F0" }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Удалить материал?"
        description="Материал будет удалён без возможности восстановления."
        loading={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
