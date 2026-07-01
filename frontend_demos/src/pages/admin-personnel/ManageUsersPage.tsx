import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronRight,
  UserCog,
  Lock,
  UserPlus,
  Ban,
  Trash2,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { AppSelect } from "../../components/AppSelect";
import { Avatar } from "../../components/Avatar";
import { UserAPI } from "../../api/UserAPI";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { AppUser } from "../../types/user";
import { UserRole } from "../../types/user";
import { ROLE_LABELS_SHORT } from "../../constants/roles";
import { getErrorMessage, isAbortError } from "../../utils/errors";
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
import { useStructureOptions } from "../../hooks/useStructureOptions";

type ConfirmAction = "block" | "unblock" | "delete" | "resetPassword" | null;

const ROLE_FILTERS: Array<UserRole | "all"> = ["all", "seller", "manager"];

export default function ManageUsersPage() {
  const navigate = useNavigate();
  const isPoPreview = useLocation().pathname.startsWith("/admin-po/preview");
  const createPath = isPoPreview ? "/admin-po/preview/personnel/create" : "/admin-personnel/manage/create";
  const detailPath = (userId: string) =>
    isPoPreview ? `/admin-po/preview/personnel/${userId}` : `/admin-personnel/manage/${userId}`;
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterBlockId, setFilterBlockId] = useState("");
  const [filterLocationId, setFilterLocationId] = useState("");

  const { blocks: structureBlocks, locations: structureLocations } = useStructureOptions();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const locationOptions = useMemo(
    () =>
      filterBlockId
        ? structureLocations.filter((location) => location.blockId === filterBlockId)
        : structureLocations,
    [filterBlockId, structureLocations],
  );

  const resetStructureFilters = () => {
    setFilterBlockId("");
    setFilterLocationId("");
  };

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await UserAPI.listUsers(
        {
          blockId: filterBlockId || undefined,
          locationId: filterLocationId || undefined,
          role: filterRole !== "all" ? filterRole : undefined,
          isActive:
            filterActive === "all" ? undefined : filterActive === "active",
        },
        signal,
      );
      setUsers(data);
    } catch (error) {
      if (isAbortError(error)) return;
      const message = getErrorMessage(error, "Не удалось загрузить список пользователей");
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filterBlockId, filterLocationId, filterRole, filterActive]);

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.externalSystemId.toLowerCase().includes(q);
      return matchQuery;
    });
  }, [users, query]);

  const openConfirm = (user: AppUser, action: ConfirmAction) => {
    setSelectedUser(user);
    setConfirmAction(action);
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setSelectedUser(null);
  };

  const handleConfirm = async () => {
    if (!selectedUser || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === "block") {
        await AdminStaffAPI.blockEmployeeProfile(selectedUser.id);
        toast.success("Профиль заблокирован");
      } else if (confirmAction === "unblock") {
        await AdminStaffAPI.unblockEmployeeProfile(selectedUser.id);
        toast.success("Профиль разблокирован");
      } else if (confirmAction === "delete") {
        await AdminStaffAPI.deleteEmployeeProfile(selectedUser.id);
        toast.success("Профиль удалён");
      } else if (confirmAction === "resetPassword") {
        const result = await AdminStaffAPI.resetPassword(selectedUser.id);
        setTempPassword(result.temporaryPassword);
        setConfirmAction(null);
        setShowPasswordModal(true);
        await loadUsers();
        return;
      }
      closeConfirm();
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmTitles: Record<Exclude<ConfirmAction, null>, string> = {
    block: "Заблокировать профиль?",
    unblock: "Разблокировать профиль?",
    delete: "Удалить профиль?",
    resetPassword: "Сбросить пароль?",
  };

  const confirmDescriptions: Record<Exclude<ConfirmAction, null>, string> = {
    block: "Сотрудник не сможет войти в систему до разблокировки.",
    unblock: "Сотрудник снова получит доступ к системе.",
    delete: "Профиль сотрудника будет удалён без возможности восстановления.",
    resetPassword: "Будет сгенерирован новый пароль для передачи сотруднику.",
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        {!isPoPreview && <ScreenBackButton to="/admin-personnel" light className="mb-3" />}
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
            Управление пользователями
          </h1>
          <button
            onClick={() => navigate(createPath)}
            className="p-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.2)" }}
            aria-label="Создать сотрудника"
          >
            <UserPlus size={20} color="#fff" />
          </button>
        </div>
        <div className="mt-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search size={16} color="#94A3B8" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по ФИО или ID..."
            className="w-full h-10 pl-9 pr-4 rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14 }}
          />
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {ROLE_FILTERS.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full"
              style={{
                background: filterRole === role ? "#2E7D32" : "#F1F5F9",
                color: filterRole === role ? "#fff" : "#374151",
                fontSize: 12,
                fontWeight: filterRole === role ? 600 : 400,
              }}
            >
              {role === "all" ? "Все роли" : ROLE_LABELS_SHORT[role]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterActive(status)}
              className="flex-1 py-1.5 rounded-lg"
              style={{
                background: filterActive === status ? "#E8F5E9" : "#F1F5F9",
                color: filterActive === status ? "#2E7D32" : "#64748B",
                fontSize: 12,
                fontWeight: filterActive === status ? 600 : 400,
              }}
            >
              {status === "all" ? "Все" : status === "active" ? "Активные" : "Заблок."}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <AppSelect
            value={filterBlockId}
            onValueChange={(v) => {
              setFilterBlockId(v);
              setFilterLocationId("");
            }}
            emptyOption={{ value: "__all_blocks__", label: "Все блоки" }}
            options={structureBlocks.map((block) => ({ value: block.id, label: block.name }))}
            className="min-w-0 h-9"
          />
          <AppSelect
            value={filterLocationId}
            onValueChange={setFilterLocationId}
            disabled={locationOptions.length === 0}
            emptyOption={{ value: "__all_locations__", label: "Все точки" }}
            options={locationOptions.map((location) => ({ value: location.id, label: location.name }))}
            className="min-w-0 h-9"
          />
          <button
            type="button"
            onClick={resetStructureFilters}
            className="h-9 w-9 rounded-lg border flex items-center justify-center"
            style={{ borderColor: "#E2E8F0", background: "#fff" }}
            aria-label="Сбросить фильтры"
          >
            <RotateCcw size={15} color="#64748B" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          {loading ? "Загрузка..." : `${filtered.length} пользователей`}
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Загрузка пользователей...
            </div>
          ) : loadError ? (
            <div className="px-4 py-8 text-center">
              <p style={{ color: "#DC2626", fontSize: 14, marginBottom: 12 }}>{loadError}</p>
              <button
                onClick={() => void loadUsers()}
                className="px-4 py-2 rounded-lg"
                style={{ background: "#2E7D32", color: "#fff", fontSize: 13 }}
              >
                Повторить
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Нет пользователей для отображения
            </div>
          ) : (
            filtered.map((user, i) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  onClick={() => navigate(detailPath(user.id))}
                >
                  <Avatar name={user.name} size={40} src={user.avatar} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{user.name}</p>
                    <p style={{ color: "#94A3B8", fontSize: 12 }}>
                      {ROLE_LABELS_SHORT[user.role] || user.role}
                      {user.isActive === false ? " · заблокирован" : ""}
                    </p>
                    <p style={{ color: "#64748B", fontSize: 11 }}>{user.externalSystemId}</p>
                    {(user.blockName || user.storeName) && (
                      <p style={{ color: "#94A3B8", fontSize: 11 }}>
                        {[user.blockName, user.storeName].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={15} color="#CBD5E1" />
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigate(detailPath(user.id))}
                    className="p-2 rounded-lg"
                    style={{ background: "#F1F5F9" }}
                    aria-label="Редактировать"
                  >
                    <UserCog size={16} color="#64748B" />
                  </button>
                  <button
                    onClick={() => openConfirm(user, "resetPassword")}
                    className="p-2 rounded-lg"
                    style={{ background: "#F1F5F9" }}
                    aria-label="Сбросить пароль"
                  >
                    <Lock size={16} color="#64748B" />
                  </button>
                  {user.isActive !== false ? (
                    <button
                      onClick={() => openConfirm(user, "block")}
                      className="p-2 rounded-lg"
                      style={{ background: "#FEF2F2" }}
                      aria-label="Заблокировать"
                    >
                      <Ban size={16} color="#DC2626" />
                    </button>
                  ) : (
                    <button
                      onClick={() => openConfirm(user, "unblock")}
                      className="p-2 rounded-lg"
                      style={{ background: "#F0FDF4" }}
                      aria-label="Разблокировать"
                    >
                      <UserCheck size={16} color="#2E7D32" />
                    </button>
                  )}
                  <button
                    onClick={() => openConfirm(user, "delete")}
                    className="p-2 rounded-lg"
                    style={{ background: "#FEF2F2" }}
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction ? confirmTitles[confirmAction] : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Пользователь: <strong>{selectedUser.name}</strong>
                  <br />
                  {confirmAction ? confirmDescriptions[confirmAction] : ""}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeConfirm} disabled={actionLoading}>
              Отмена
            </Button>
            <Button
              variant={confirmAction === "delete" || confirmAction === "block" ? "destructive" : "default"}
              onClick={() => void handleConfirm()}
              disabled={actionLoading}
            >
              {actionLoading ? "Выполняется..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPasswordModal}
        onOpenChange={(open) => {
          setShowPasswordModal(open);
          if (!open) {
            setTempPassword("");
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сброс пароля</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Пользователь: <strong>{selectedUser.name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="p-3 rounded-lg" style={{ background: "#F0FDF4" }}>
              <p style={{ color: "#166534", fontSize: 12, marginBottom: 4 }}>Новый пароль:</p>
              <p
                style={{
                  color: "#166534",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                {tempPassword}
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false);
                setTempPassword("");
                setSelectedUser(null);
              }}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
