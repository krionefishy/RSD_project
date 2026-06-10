import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronRight, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useStructureBasePath } from "../../hooks/useStructureBasePath";
import { LocationsAPI } from "../../api/LocationsAPI";
import type { BlockSummary } from "../../types/location";
import { useApp } from "../../context/AppContext";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { canManageStructure } from "../../utils/structureAccess";
import { toast } from "sonner";

export default function BlocksListPage() {
  const navigate = useNavigate();
  const paths = useStructureBasePath();
  const { user } = useApp();
  const canEdit = canManageStructure(user?.role);

  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadBlocks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await LocationsAPI.listBlocks(undefined, signal);
      setBlocks(data);
    } catch (error) {
      if (isAbortError(error)) return;
      toast.error(getErrorMessage(error, "Не удалось загрузить блоки"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadBlocks(controller.signal);
    return () => controller.abort();
  }, [loadBlocks]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Введите название блока");
      return;
    }
    setCreating(true);
    try {
      const block = await LocationsAPI.createBlock({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setBlocks((prev) => [...prev, block].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      toast.success("Блок создан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать блок"));
    } finally {
      setCreating(false);
    }
  };

  const totalStores = blocks.reduce((sum, block) => sum + block.stores, 0);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <ScreenBackButton to={paths.home} light className="mb-3" />
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Блоки</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
          {loading ? "Загрузка..." : `${blocks.length} блоков · ${totalStores} точек`}
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => navigate(paths.locations)}
            className="flex-1 h-10 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#fff", color: "#2E7D32", fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <MapPin size={16} />
            Все точки
          </button>
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 h-10 rounded-[10px] flex items-center justify-center gap-2"
              style={{ background: "#2E7D32", color: "#fff", fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={16} />
              Блок
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Загрузка...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Нет блоков</p>
          </div>
        ) : (
          blocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => navigate(paths.block(block.id))}
              className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <Building2 size={20} color="#2E7D32" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>{block.name}</p>
                {block.description && (
                  <p style={{ color: "#94A3B8", fontSize: 12 }} className="truncate">
                    {block.description}
                  </p>
                )}
                <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                  {block.stores} точек · {block.employees} сотрудников
                </p>
                <p style={{ color: "#94A3B8", fontSize: 11 }}>
                  Менеджер: {block.managerName || "не назначен"}
                </p>
              </div>
              <ChevronRight size={18} color="#CBD5E1" />
            </button>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Новый блок</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название"
              className="w-full h-10 px-3 rounded-lg border mb-2"
              style={{ borderColor: "#E2E8F0", fontSize: 14 }}
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border"
              style={{ borderColor: "#E2E8F0", fontSize: 14 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14 }}
              >
                Отмена
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#2E7D32", color: "#fff", fontSize: 14, opacity: creating ? 0.7 : 1 }}
              >
                {creating ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
