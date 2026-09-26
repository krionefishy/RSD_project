import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Ban,
  Trash2,
  UserCheck,
  UserPlus,
  Shield,
} from "lucide-react";
import { useLocation } from "react-router";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { Avatar } from "../../components/Avatar";
import { AdminSoftwareAPI } from "../../api/AdminSoftwareAPI";
import { AppUser, UserRole } from "../../types/user";
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
import { Hint } from "../../components/ui/hint";
import { AppSelect } from "../../components/AppSelect";

type ConfirmAction = "block" | "unblock" | "delete" | null;
type ChangeRoleState = { user: AppUser; newRole: UserRole } | null;
type CreatedCredentials = { login: string; password: string } | null;

const ALL_ROLES: Array<UserRole | "all"> = [
  "all",
  "seller",
  "manager",
  "admin-personnel",
  "admin-edu",
  "admin-sales",
  "admin-po",
];

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "seller", label: "Продавец" },
  { value: "manager", label: "Менеджер" },
  { value: "admin-personnel", label: "Админ персонала" },
  { value: "admin-edu", label: "Админ обучения" },
  { value: "admin-sales", label: "Админ продаж" },
  { value: "admin-po", label: "Администратор ПО" },
];

const CREATE_ROLE_OPTIONS = ROLE_OPTIONS.filter((option) => option.value !== "admin-po");

const EMPTY_CREATE_FORM = {
  externalSystemId: "",
  password: "",
  role: "seller" as UserRole,
  firstName: "",
  lastName: "",
  phone: "",
  position: "",
};

export default function AccountsPage() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/superadmin");
  const backPath = isSuperAdmin ? "/superadmin" : "/admin-po";
  const accent = isSuperAdmin ? "#C41E3A" : "#2E7D32";
  const accentDark = isSuperAdmin ? "#A3152E" : "#1B5E20";
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [changeRoleState, setChangeRoleState] = useState<ChangeRoleState>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>("seller");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials>(null);

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError(null);
      try {
        const isActive =
          filterActive === "all" ? undefined : filterActive === "active";
        const data = await AdminSoftwareAPI.listUsers({
          isActive,
        });
        if (!signal?.aborted) setUsers(data);
      } catch (error) {
        if (isAbortError(error)) return;
        const message = getErrorMessage(error, "Не удалось загрузить список пользователей");
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [filterActive],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.externalSystemId.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, query, filterRole]);

  const openConfirm = (user: AppUser, action: ConfirmAction) => {
    setSelectedUser(user);
    setConfirmAction(action);
  };

  const closeConfirm = () => {
    setConfirmAction(null);
    setSelectedUser(null);
  };

  const openChangeRole = (user: AppUser) => {
    setSelectedNewRole(user.role);
    setChangeRoleState({ user, newRole: user.role });
  };

  const handleConfirm = async () => {
    if (!selectedUser || !confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction === "block") {
        await AdminSoftwareAPI.blockUser(selectedUser.id);
        toast.success("Аккаунт заблокирован");
      } else if (confirmAction === "unblock") {
        await AdminSoftwareAPI.unblockUser(selectedUser.id);
        toast.success("Аккаунт разблокирован");
      } else if (confirmAction === "delete") {
        await AdminSoftwareAPI.deleteUser(selectedUser.id);
        toast.success("Аккаунт удалён");
      }
      closeConfirm();
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!changeRoleState) return;
    setActionLoading(true);
    try {
      await AdminSoftwareAPI.changeUserRole(changeRoleState.user.id, selectedNewRole);
      toast.success("Роль изменена");
      setChangeRoleState(null);
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось изменить роль"));
    } finally {
      setActionLoading(false);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreatedCredentials(null);
  };

  const handleCreateUser = async () => {
    const externalSystemId = createForm.externalSystemId.trim();
    if (!externalSystemId) {
      toast.error("Укажите логин пользователя");
      return;
    }
    if (createForm.password.length < 8) {
      toast.error("Пароль должен содержать не менее 8 символов");
      return;
    }

    setActionLoading(true);
    try {
      const result = await AdminSoftwareAPI.createUser({
        externalSystemId,
        password: createForm.password,
        role: createForm.role,
        firstName: createForm.firstName.trim() || undefined,
        lastName: createForm.lastName.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        position: createForm.position.trim() || undefined,
      });
      setCreatedCredentials({ login: externalSystemId, password: result.tempPassword });
      toast.success("Пользователь создан");
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать пользователя"));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmTitles: Record<Exclude<ConfirmAction, null>, string> = {
    block: "Заблокировать аккаунт?",
    unblock: "Разблокировать аккаунт?",
    delete: "Удалить аккаунт?",
  };

  const confirmDescriptions: Record<Exclude<ConfirmAction, null>, string> = {
    block: "Пользователь не сможет войти в систему до разблокировки.",
    unblock: "Пользователь снова получит доступ к системе.",
    delete: "Аккаунт будет удалён без возможности восстановления.",
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: `linear-gradient(160deg, ${accent} 0%, ${accentDark} 100%)` }}
      >
        <ScreenBackButton to={backPath} light className="mb-3" />
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>
            Аккаунты
          </h1>
          <Hint content="Создать пользователя">
            <button
              onClick={() => setCreateOpen(true)}
              className="p-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)" }}
              aria-label="Создать пользователя"
            >
              <UserPlus size={20} color="#fff" />
            </button>
          </Hint>
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

      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}
      >
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full"
              style={{
                background: filterRole === role ? accent : "#F1F5F9",
                color: filterRole === role ? "#fff" : "#374151",
                fontSize: 12,
                fontWeight: filterRole === role ? 600 : 400,
              }}
            >
              {role === "all" ? "Все роли" : ROLE_LABELS_SHORT[role] ?? role}
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
                color: filterActive === status ? accent : "#64748B",
                fontSize: 12,
                fontWeight: filterActive === status ? 600 : 400,
              }}
            >
              {status === "all" ? "Все" : status === "active" ? "Активные" : "Заблок."}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          {loading ? "Загрузка..." : `${filtered.length} аккаунтов`}
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Загрузка аккаунтов...
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
              Нет аккаунтов для отображения
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
                <Avatar name={user.name} size={40} src={user.avatar} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{user.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>
                    {ROLE_LABELS_SHORT[user.role] || user.role}
                    {user.isActive === false ? " · заблокирован" : ""}
                  </p>
                  <p style={{ color: "#64748B", fontSize: 11 }}>{user.externalSystemId}</p>
                </div>
                {user.role !== "superadmin" && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Hint content="Изменить роль пользователя">
                    <button
                      onClick={() => openChangeRole(user)}
                      className="p-2 rounded-lg"
                      style={{ background: "#EFF6FF" }}
                      aria-label="Изменить роль"
                    >
                      <Shield size={16} color="#3B82F6" />
                    </button>
                  </Hint>
                  {user.isActive !== false ? (
                    <Hint content="Заблокировать пользователя">
                      <button
                        onClick={() => openConfirm(user, "block")}
                        className="p-2 rounded-lg"
                        style={{ background: "#FEF2F2" }}
                        aria-label="Заблокировать"
                      >
                        <Ban size={16} color="#DC2626" />
                      </button>
                    </Hint>
                  ) : (
                    <Hint content="Разблокировать пользователя">
                      <button
                        onClick={() => openConfirm(user, "unblock")}
                        className="p-2 rounded-lg"
                        style={{ background: "#F0FDF4" }}
                        aria-label="Разблокировать"
                      >
                        <UserCheck size={16} color="#2E7D32" />
                      </button>
                    </Hint>
                  )}
                  <Hint content="Удалить пользователя">
                    <button
                      onClick={() => openConfirm(user, "delete")}
                      className="p-2 rounded-lg"
                      style={{ background: "#FEF2F2" }}
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </button>
                  </Hint>
                </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm block/unblock/delete dialog */}
      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction ? confirmTitles[confirmAction] : ""}</DialogTitle>
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
              variant={
                confirmAction === "delete" || confirmAction === "block"
                  ? "destructive"
                  : "default"
              }
              onClick={() => void handleConfirm()}
              disabled={actionLoading}
            >
              {actionLoading ? "Выполняется..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createdCredentials ? "Пользователь создан" : "Новый пользователь"}</DialogTitle>
            <DialogDescription>
              {createdCredentials
                ? "Сохраните данные и передайте их пользователю безопасным способом."
                : "Создайте аккаунт и сразу назначьте рабочую роль."}
            </DialogDescription>
          </DialogHeader>

          {createdCredentials ? (
            <div className="rounded-xl p-3" style={{ background: "#F0FDF4" }}>
              <p style={{ color: "#166534", fontSize: 12 }}>Логин</p>
              <p className="font-mono mb-3" style={{ color: "#166534", fontSize: 15, fontWeight: 600 }}>
                {createdCredentials.login}
              </p>
              <p style={{ color: "#166534", fontSize: 12 }}>Пароль</p>
              <p className="font-mono" style={{ color: "#166534", fontSize: 15, fontWeight: 600 }}>
                {createdCredentials.password}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-1">
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Логин *</span>
                <input
                  value={createForm.externalSystemId}
                  onChange={(event) => setCreateForm({ ...createForm, externalSystemId: event.target.value })}
                  className="h-10 rounded-lg border px-3"
                  style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                  placeholder="external_system_id"
                  autoComplete="off"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Пароль *</span>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
                  className="h-10 rounded-lg border px-3"
                  style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Роль *</span>
                <AppSelect
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
                  options={CREATE_ROLE_OPTIONS}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#64748B", fontSize: 12 }}>Имя</span>
                  <input
                    value={createForm.firstName}
                    onChange={(event) => setCreateForm({ ...createForm, firstName: event.target.value })}
                    className="h-10 rounded-lg border px-3 min-w-0"
                    style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span style={{ color: "#64748B", fontSize: 12 }}>Фамилия</span>
                  <input
                    value={createForm.lastName}
                    onChange={(event) => setCreateForm({ ...createForm, lastName: event.target.value })}
                    className="h-10 rounded-lg border px-3 min-w-0"
                    style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Телефон</span>
                <input
                  value={createForm.phone}
                  onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })}
                  className="h-10 rounded-lg border px-3"
                  style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                  placeholder="+7..."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Должность</span>
                <input
                  value={createForm.position}
                  onChange={(event) => setCreateForm({ ...createForm, position: event.target.value })}
                  className="h-10 rounded-lg border px-3"
                  style={{ borderColor: "#CBD5E1", fontSize: 14 }}
                />
              </label>
              {isSuperAdmin && (
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  Администратор ПО назначается после создания пользователя на вкладке «Обзор».
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {createdCredentials ? (
              <Button onClick={closeCreate}>Готово</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeCreate} disabled={actionLoading}>
                  Отмена
                </Button>
                <Button onClick={() => void handleCreateUser()} disabled={actionLoading}>
                  {actionLoading ? "Создание..." : "Создать"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog
        open={changeRoleState !== null}
        onOpenChange={(open) => !open && setChangeRoleState(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
            <DialogDescription>
              {changeRoleState && (
                <>
                  Пользователь: <strong>{changeRoleState.user.name}</strong>
                  <br />
                  Текущая роль:{" "}
                  <strong>
                    {ROLE_LABELS_SHORT[changeRoleState.user.role] || changeRoleState.user.role}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <AppSelect
              value={selectedNewRole}
              onValueChange={(v) => setSelectedNewRole(v as UserRole)}
              options={isSuperAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((option) => option.value !== "admin-po")}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setChangeRoleState(null)}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button onClick={() => void handleChangeRole()} disabled={actionLoading}>
              {actionLoading ? "Сохранение..." : "Изменить роль"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
