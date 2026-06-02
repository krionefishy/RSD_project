import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useStructureBasePath } from "../../hooks/useStructureBasePath";
import { LocationsAPI } from "../../api/LocationsAPI";
import { PersonnelAPI } from "../../api/PersonnelAPI";
import { UserAPI } from "../../api/UserAPI";
import { TimesheetEntriesList } from "../../components/timesheets/TimesheetEntriesList";
import { TimesheetMonthFilter } from "../../components/timesheets/TimesheetMonthFilter";
import type { TimesheetEntry } from "../../types/profile";
import { monthPeriodQuery } from "../../utils/timesheet";
import type { LocationDetail } from "../../types/location";
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

type ConfirmKind = "deleteLocation" | "removeMember" | null;

function memberName(member: { firstName?: string | null; lastName?: string | null; externalSystemId: string }) {
  const parts = [member.lastName, member.firstName].filter(Boolean);
  return parts.join(" ").trim() || member.externalSystemId;
}

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const paths = useStructureBasePath();
  const { user } = useApp();
  const canEditStructure = canManageStructure(user?.role);
  const canAssignStaff = user?.role === "admin-personnel" || canEditStructure;

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({ code: "", name: "", address: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [timesheetTotalHours, setTimesheetTotalHours] = useState("0");
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const [timesheetError, setTimesheetError] = useState<string | null>(null);

  const loadLocation = useCallback(async (signal?: AbortSignal) => {
    if (!locationId) return;
    setLoading(true);
    try {
      const data = await LocationsAPI.getLocation(locationId, signal);
      setLocation(data);
      setForm({
        code: data.code,
        name: data.name,
        address: data.address,
        city: data.city ?? "",
      });
    } catch (error) {
      if (isAbortError(error)) return;
      toast.error(getErrorMessage(error, "Не удалось загрузить точку"));
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadLocation(controller.signal);
    return () => controller.abort();
  }, [loadLocation]);

  useEffect(() => {
    if (!locationId) return;
    const controller = new AbortController();
    setTimesheetLoading(true);
    setTimesheetError(null);
    PersonnelAPI.getLocationTimesheet(Number(locationId), monthPeriodQuery(monthDate), controller.signal)
      .then((data) => {
        setTimesheetEntries(data.items);
        setTimesheetTotalHours(data.totalHours);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        setTimesheetError(getErrorMessage(error, "Не удалось загрузить табель точки"));
        setTimesheetEntries([]);
        setTimesheetTotalHours("0");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTimesheetLoading(false);
      });
    return () => controller.abort();
  }, [locationId, monthDate]);

  const handleSave = async () => {
    if (!locationId) return;
    setSaving(true);
    try {
      const updated = await LocationsAPI.updateLocation(locationId, {
        code: form.code.trim(),
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim() || null,
      });
      setLocation((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Точка обновлена");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить точку"));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUser = async () => {
    if (!locationId || !assignUserId.trim()) return;
    try {
      const users = await UserAPI.listUsers({ role: "seller", isActive: true });
      const target = users.find(
        (item) => item.id === assignUserId.trim() || item.externalSystemId === assignUserId.trim(),
      );
      if (!target) {
        toast.error("Сотрудник не найден");
        return;
      }
      await LocationsAPI.assignUserToLocation(target.id, Number(locationId));
      setAssignUserId("");
      toast.success("Сотрудник назначен на точку");
      await loadLocation();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось назначить сотрудника"));
    }
  };

  const runConfirm = async () => {
    if (!locationId) return;
    setActionLoading(true);
    try {
      if (confirmKind === "deleteLocation") {
        await LocationsAPI.deleteLocation(locationId);
        toast.success("Точка удалена");
        navigate(paths.locations);
        return;
      }
      if (confirmKind === "removeMember" && confirmUserId) {
        const profile = await UserAPI.getUserProfile(confirmUserId);
        if (profile.location?.id !== Number(locationId)) {
          toast.error("Сотрудник уже привязан к другой точке");
          await loadLocation();
          return;
        }
        await LocationsAPI.removeUserFromLocation(confirmUserId);
        toast.success("Сотрудник снят с точки");
      }
      await loadLocation();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
      setConfirmKind(null);
      setConfirmUserId(null);
    }
  };

  if (loading || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
        <p style={{ color: "#64748B" }}>{loading ? "Загрузка..." : "Точка не найдена"}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate(paths.locations)}
          className="flex items-center gap-1 mb-3"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} />
          Точки
        </button>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>{location.name}</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
          {location.code} · {location.blockName || "Без блока"}
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {canEditStructure && (
          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: "#fff" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Редактирование</p>
            {(["code", "name", "address", "city"] as const).map((field) => (
              <input
                key={field}
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                className="h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
            ))}
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="h-10 rounded-lg"
              style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 600 }}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              onClick={() => setConfirmKind("deleteLocation")}
              className="h-10 rounded-lg flex items-center justify-center gap-2"
              style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 14 }}
            >
              <Trash2 size={16} />
              Удалить точку
            </button>
          </div>
        )}

        <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
          <p style={{ fontSize: 13, color: "#64748B" }}>{location.address}</p>
          {location.city && <p style={{ fontSize: 13, color: "#64748B" }}>{location.city}</p>}
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{location.employees} сотрудников на точке</p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>Табель точки</p>
          <div className="mb-3">
            <TimesheetMonthFilter monthDate={monthDate} onChange={setMonthDate} />
          </div>
          <TimesheetEntriesList
            entries={timesheetEntries}
            totalHours={timesheetTotalHours}
            loading={timesheetLoading}
            error={timesheetError}
            showEmployee
            emptyMessage="Нет записей за период или нет доступа"
          />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>Сотрудники точки</p>
            {canAssignStaff && (
              <div className="flex gap-1">
                <input
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="ID сотрудника"
                  className="h-8 px-2 rounded-lg border text-xs w-[120px]"
                  style={{ borderColor: "#E2E8F0" }}
                />
                <button
                  onClick={() => void handleAssignUser()}
                  className="h-8 px-2 rounded-lg flex items-center"
                  style={{ background: "#E8F5E9", color: "#2E7D32" }}
                >
                  <UserPlus size={14} />
                </button>
              </div>
            )}
          </div>
          {location.members.length === 0 ? (
            <p className="px-4 py-6 text-center" style={{ color: "#94A3B8", fontSize: 13 }}>
              Нет сотрудников
            </p>
          ) : (
            location.members.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: index < location.members.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => navigate(paths.employee(member.id))}
                >
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>{memberName(member)}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>{member.externalSystemId}</p>
                </button>
                {canAssignStaff && (
                  <button
                    onClick={() => {
                      setConfirmUserId(member.id);
                      setConfirmKind("removeMember");
                    }}
                    className="p-2 rounded-lg"
                    style={{ background: "#FEF2F2" }}
                    aria-label="Снять с точки"
                  >
                    <UserMinus size={14} color="#DC2626" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={confirmKind !== null} onOpenChange={(open) => !open && setConfirmKind(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите действие</DialogTitle>
            <DialogDescription>
              {confirmKind === "deleteLocation" && "Точка будет удалена без возможности восстановления."}
              {confirmKind === "removeMember" && "Сотрудник будет снят с этой точки."}
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
