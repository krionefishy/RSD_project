import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../../api/KnowledgeAPI";
import type { Material } from "../../../types/knowledge";
import { getErrorMessage } from "../../../utils/errors";
import { ConfirmDialog } from "./ConfirmDialog";

export function MaterialsTab() {
  const navigate = useNavigate();
  const isPoPreview = useLocation().pathname.startsWith("/admin-po/preview");
  const editMaterialPath = (materialId: number) =>
    isPoPreview ? `/admin-po/preview/edu/edit-material/${materialId}` : `/admin-edu/manage/edit-material/${materialId}`;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMaterialId, setUploadMaterialId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMaterials(await KnowledgeAPI.listMaterials());
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить материалы"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.text.trim()) {
      toast.error("Заполните название, категорию и текст");
      return;
    }
    try {
      const material = await KnowledgeAPI.createMaterial({
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim() || undefined,
        text: form.text,
      });
      toast.success("Материал создан");
      setShowCreate(false);
      setForm({ name: "", category: "", description: "", text: "" });
      await load();
      navigate(editMaterialPath(material.id));
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать материал"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await KnowledgeAPI.deleteMaterial(deleteTarget.id);
      toast.success("Материал удалён");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить материал"));
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (uploadMaterialId === null) return;
    try {
      const attachment = await KnowledgeAPI.uploadMaterialAttachment(uploadMaterialId, file);
      setMaterials((prev) =>
        prev.map((material) =>
          material.id === uploadMaterialId
            ? { ...material, attachments: [...material.attachments, attachment] }
            : material,
        ),
      );
      toast.success("Вложение загружено");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить файл"));
    } finally {
      setUploadMaterialId(null);
    }
  };

  const handleDeleteAttachment = async (material: Material, attachmentId: number) => {
    try {
      await KnowledgeAPI.deleteMaterialAttachment(material.id, attachmentId);
      setMaterials((prev) =>
        prev.map((item) =>
          item.id === material.id
            ? { ...item, attachments: item.attachments.filter((a) => a.id !== attachmentId) }
            : item,
        ),
      );
      toast.success("Вложение удалено");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить вложение"));
    }
  };

  if (loading) {
    return <p className="text-center py-8 text-sm text-slate-500">Загрузка материалов...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => setShowCreate(true)}
        className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 bg-[#C41E3A] text-white text-sm font-semibold"
      >
        <Plus size={18} />
        Создать материал
      </button>

      {materials.map((material) => (
        <div key={material.id} className="rounded-2xl bg-white shadow-sm p-4">
          <div className="flex items-start gap-3 max-sm:flex-col">
            <FileText size={20} color="#64748B" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <button
                type="button"
                className="text-left font-semibold text-slate-800 text-sm break-words"
                onClick={() => navigate(editMaterialPath(material.id))}
              >
                {material.name}
              </button>
              <p className="text-xs text-slate-400">{material.category}</p>
              {material.attachments.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {material.attachments.map((att) => (
                    <div key={att.id} className="flex items-start justify-between gap-2 text-xs text-slate-600">
                      <span className="break-all">
                        {att.name}.{att.format}
                      </span>
                      <button type="button" className="flex-shrink-0" onClick={() => void handleDeleteAttachment(material, att.id)}>
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 max-sm:w-full max-sm:flex-row">
              <button
                type="button"
                className="text-xs text-[#2E7D32] max-sm:flex-1 max-sm:rounded-lg max-sm:bg-emerald-50 max-sm:px-3 max-sm:py-2"
                onClick={() => {
                  setUploadMaterialId(material.id);
                  fileInputRef.current?.click();
                }}
              >
                Файл
              </button>
              <button
                type="button"
                className="max-sm:flex max-sm:flex-1 max-sm:items-center max-sm:justify-center max-sm:rounded-lg max-sm:bg-red-50 max-sm:px-3 max-sm:py-2"
                onClick={() => setDeleteTarget(material)}
              >
                <Trash2 size={16} color="#DC2626" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-4 sm:p-5">
            <h3 className="font-semibold text-slate-800">Новый материал</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Название материала</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: Открытие смены"
                  className="h-11 rounded-lg border px-3 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Категория</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Например: Касса"
                  className="h-11 rounded-lg border px-3 text-sm"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Краткое описание</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="1-2 предложения о содержании материала"
                rows={3}
                className="rounded-lg border px-3 py-2 text-sm resize-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Содержание материала</span>
              <textarea
                value={form.text}
                onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="Содержание (Markdown)"
                rows={8}
                className="rounded-lg border px-3 py-2 text-sm font-mono resize-none"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => setShowCreate(false)} className="h-11 shrink-0 rounded-lg bg-slate-100 px-4 text-sm sm:min-w-32 sm:flex-1">
                Отмена
              </button>
              <button onClick={() => void handleCreate()} className="h-11 shrink-0 rounded-lg bg-[#C41E3A] px-4 text-sm text-white sm:min-w-32 sm:flex-1">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить материал?"
        description="Материал и вложения будут удалены без возможности восстановления."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
