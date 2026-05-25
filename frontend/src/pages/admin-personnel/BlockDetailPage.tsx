import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, MapPin, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useStructureBasePath } from "../../hooks/useStructureBasePath";
import { LocationsAPI } from "../../api/LocationsAPI";
import { UserAPI } from "../../api/UserAPI";
import type { BlockDetail } from "../../types/location";
import { useApp } from "../../context/AppContext";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { canManageStructure } from "../../utils/structureAccess";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

type ConfirmKind = "deleteBlock" | "removeLocation" | "removeManager" | null;

function memberName(member: { firstName?: string | null; lastName?: string | null; externalSystemId: string }) {
  const parts = [member.lastName, member.firstName].filter(Boolean);
  return parts.join(" ").trim() || member.externalSystemId;
}

export default function BlockDetailPage() {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const paths = useStructureBasePath();
  const { user } = useApp();
  const canEdit = canManageStructure(user?.role);

  const [block, setBlock] = useState<BlockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ locationId?: string; managerId?: string }>({});
  const [actionLoading, setActionLoading] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [allLocations, setAllLocations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [assignLocationId, setAssignLocationId] = useState("");
  const [managers, setManagers] = useState<{ id: string; label: string }[]>([]);
  const [managerId, setManagerId] = useState("");

  const loadBlock = useCallback(async (signal?: AbortSignal) => {
    if (!blockId) return;
    setLoading(true);
    try {
      const data = await LocationsAPI.getBlock(blockId, signal);
      setBlock(data);
      setEditName(data.name);
      setEditDescription(data.description ?? "");
    } catch (error) {
      if (isAbortError(error)) return;
      toast.error(getErrorMessage(error, "Не удалось загрузить блок"));
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadBlock(controller.signal);
    return () => controller.abort();
  }, [loadBlock]);

  useEffect(() => {
    if (!canEdit) return;
    const controller = new AbortController();
    LocationsAPI.listLocations(undefined, controller.signal)
      .then((locations) => setAllLocations(locations.map((l) => ({ id: l.id, name: l.name, code: l.code }))))
      .catch(() => undefined);
    return () => controller.abort();
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit) return;
    const controller = new AbortController();
    UserAPI.listUsers({ role: "manager", isActive: true }, controller.signal)
      .then((items) =>
        setManagers(
          items.map((item) => ({
            id: item.id,
            label: `${item.lastName || ""} ${item.firstName || ""}`.trim() || item.externalSystemId,
          })),
        ),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [canEdit]);

  const unassignedLocations = allLocations.filter(
    (location) => !block?.locations.some((assigned) => assigned.id === location.id),
  );

  const handleSave = async () => {
    if (!blockId || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await LocationsAPI.updateBlock(blockId, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setBlock((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Блок обновлён");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить блок"));
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async () => {
    if (!blockId || !block) return;
    setActionLoading(true);
    try {
      if (confirmKind === "deleteBlock") {
        await LocationsAPI.deleteBlock(blockId);
        toast.success("Блок удалён");
        navigate(paths.blocks);
        return;
      }
      if (confirmKind === "removeLocation" && confirmTarget.locationId) {
        await LocationsAPI.removeLocationFromBlock(blockId, confirmTarget.locationId);
        toast.success("Точка отвязана от блока");
      }
      if (confirmKind === "removeManager" && block.managerId) {
        await LocationsAPI.removeManagerFromBlock(block.managerId, blockId);
        toast.success("Менеджер снят с блока");
      }
      await loadBlock();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
      setConfirmKind(null);
      setConfirmTarget({});
    }
  };

  const handleAssignLocation = async () => {
    if (!blockId || !assignLocationId) return;
    try {
      await LocationsAPI.assignLocationToBlock(blockId, assignLocationId);
      setAssignLocationId("");
      toast.success("Точка добавлена в блок");
      await loadBlock();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось привязать точку"));
    }
  };

  const handleAssignManager = async () => {
    if (!blockId || !managerId.trim()) return;
    try {
      await LocationsAPI.assignManagerToBlock(managerId.trim(), blockId);
      setManagerId("");
      toast.success("Менеджер назначен");
      await loadBlock();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось назначить менеджера"));
    }
  };

  if (loading || !block) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
        <p style={{ color: "#64748B" }}>{loading ? "Загрузка..." : "Блок не найден"}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate(paths.blocks)}
          className="flex items-center gap-1 mb-3"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} />
          Блоки
        </button>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{block.name}</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
          {block.stores} точек · {block.employees} сотрудников
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {canEdit && (
          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "#fff" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Редактирование</p>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-10 px-3 rounded-lg border"
              style={{ borderColor: "#E2E8F0", fontSize: 14 }}
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="px-3 py-2 rounded-lg border"
              style={{ borderColor: "#E2E8F0", fontSize: 14 }}
            />
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-10 rounded-lg"
              style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 600 }}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setConfirmKind("deleteBlock")}
              className="h-10 rounded-lg flex items-center justify-center gap-2"
              style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}
            >
              <Trash2 size={16} />
              Удалить блок
            </button>
          </div>
        )}

        <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>Менеджер</p>
          <p style={{ fontSize: 13, color: "#64748B" }}>{block.managerName || "Не назначен"}</p>
          {canEdit && (
            <div className="flex gap-2 mt-3">
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "#E2E8F0" }}
              >
                <option value="">Выбрать менеджера</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void handleAssignManager()}
                disabled={!managerId}
                className="h-9 px-3 rounded-lg flex items-center gap-1"
                style={{
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: managerId ? 1 : 0.5,
                }}
              >
                <UserPlus size={14} />
                Назначить
              </button>
              {block.managerId && (
                <button
                  onClick={() => setConfirmKind("removeManager")}
                  className="h-9 px-3 rounded-lg"
                  style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 12 }}
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Точки блока</p>
            {canEdit && unassignedLocations.length > 0 && (
              <div className="flex gap-1">
                <select
                  value={assignLocationId}
                  onChange={(e) => setAssignLocationId(e.target.value)}
                  className="h-8 px-2 rounded-lg border text-xs max-w-[140px]"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <option value="">Добавить...</option>
                  {unassignedLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void handleAssignLocation()}
                  disabled={!assignLocationId}
                  className="h-8 px-2 rounded-lg text-xs font-semibold"
                  style={{ background: "#2E7D32", color: "#fff", opacity: assignLocationId ? 1 : 0.5 }}
                >
                  OK
                </button>
              </div>
            )}
          </div>
          {block.locations.length === 0 ? (
            <p className="px-4 py-6 text-center" style={{ color: "#94A3B8", fontSize: 13 }}>
              Нет точек в блоке
            </p>
          ) : (
            block.locations.map((location, index) => (
              <div
                key={location.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: index < block.locations.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => navigate(paths.location(location.id))}
                >
                  <MapPin size={16} color="#2E7D32" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{location.name}</p>
                    <p style={{ fontSize: 11, color: "#94A3B8" }}>
                      {location.code} · {location.employees} чел.
                    </p>
                  </div>
                </button>
                {canEdit && (
                  <button
                    onClick={() => {
                      setConfirmTarget({ locationId: location.id });
                      setConfirmKind("removeLocation");
                    }}
                    className="p-2 rounded-lg"
                    style={{ background: "#FEF2F2" }}
                    aria-label="Отвязать точку"
                  >
                    <Trash2 size={14} color="#DC2626" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff" }}>
          <p className="px-4 py-3" style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", borderBottom: "1px solid #F1F5F9" }}>
            Сотрудники блока
          </p>
          {block.members.length === 0 ? (
            <p className="px-4 py-6 text-center" style={{ color: "#94A3B8", fontSize: 13 }}>
              Нет сотрудников
            </p>
          ) : (
            block.members.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => navigate(paths.employee(member.id))}
                className="w-full px-4 py-3 text-left"
                style={{ borderBottom: index < block.members.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{memberName(member)}</p>
                <p style={{ fontSize: 11, color: "#94A3B8" }}>{member.externalSystemId}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <Dialog open={confirmKind !== null} onOpenChange={(open) => !open && setConfirmKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите действие</DialogTitle>
            <DialogDescription>
              {confirmKind === "deleteBlock" && "Блок и все привязки будут удалены. Это действие нельзя отменить."}
              {confirmKind === "removeLocation" && "Точка будет отвязана от блока."}
              {confirmKind === "removeManager" && "Менеджер будет снят с блока."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmKind(null)}>
              Отмена
            </Button>
            <Button variant="destructive" disabled={actionLoading} onClick={() => void runConfirm()}>
              {actionLoading ? "Выполнение..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
