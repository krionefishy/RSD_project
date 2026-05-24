import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronRight, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useStructureBasePath } from "../../hooks/useStructureBasePath";
import { LocationsAPI } from "../../api/LocationsAPI";
import type { BlockSummary, LocationSummary } from "../../types/location";
import { useApp } from "../../context/AppContext";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { canManageStructure } from "../../utils/structureAccess";
import { toast } from "sonner";

export default function LocationsListPage() {
  const navigate = useNavigate();
  const paths = useStructureBasePath();
  const { user } = useApp();
  const canEdit = canManageStructure(user?.role);

  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [filterBlockId, setFilterBlockId] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", address: "", city: "" });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [locationsData, blocksData] = await Promise.all([
        LocationsAPI.listLocations(filterBlockId ? { blockId: filterBlockId } : undefined, signal),
        LocationsAPI.listBlocks(undefined, signal),
      ]);
      setLocations(locationsData);
      setBlocks(blocksData);
    } catch (error) {
      if (isAbortError(error)) return;
      toast.error(getErrorMessage(error, "Не удалось загрузить точки"));
    } finally {
      setLoading(false);
    }
  }, [filterBlockId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.address.trim()) {
      toast.error("Заполните код, название и адрес");
      return;
    }
    setCreating(true);
    try {
      const location = await LocationsAPI.createLocation({
        code: form.code.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim() || undefined,
      });
      setLocations((prev) => [...prev, location].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setForm({ code: "", name: "", address: "", city: "" });
      toast.success("Точка создана");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать точку"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate(paths.blocks)}
          className="flex items-center gap-1 mb-3"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <Building2 size={16} />
          Блоки
        </button>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Точки</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
          {loading ? "Загрузка..." : `${locations.length} точек`}
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <select
            value={filterBlockId}
            onChange={(e) => setFilterBlockId(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border text-sm"
            style={{ borderColor: "#E2E8F0", background: "#fff" }}
          >
            <option value="">Все блоки</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="h-10 px-4 rounded-lg flex items-center gap-1"
              style={{ background: "#2E7D32", color: "#fff", fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={16} />
              Точка
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Загрузка...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Нет точек</p>
          </div>
        ) : (
          locations.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => navigate(paths.location(location.id))}
              className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <MapPin size={20} color="#2E7D32" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>{location.name}</p>
                <p style={{ color: "#94A3B8", fontSize: 12 }}>{location.code}</p>
                <p style={{ color: "#64748B", fontSize: 12 }} className="truncate">
                  {location.address}
                  {location.city ? `, ${location.city}` : ""}
                </p>
                <p style={{ color: "#94A3B8", fontSize: 11 }}>
                  {location.blockName || "Без блока"} · {location.employees} сотрудников
                </p>
              </div>
              <ChevronRight size={18} color="#CBD5E1" />
            </button>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4 flex flex-col gap-2" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600 }}>Новая точка</h3>
            {(["code", "name", "address", "city"] as const).map((field) => (
              <input
                key={field}
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                placeholder={
                  field === "code"
                    ? "Код"
                    : field === "name"
                      ? "Название"
                      : field === "address"
                        ? "Адрес"
                        : "Город"
                }
                className="h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
            ))}
            <div className="flex gap-2 mt-2">
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
