import { useEffect, useState } from "react";
import { Globe, Building2, Users, Crown, Shield, LogOut, UserCheck, UserMinus, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { SuperAdminAPI } from "../../api/SuperAdminAPI";
import { AppUser } from "../../types/user";
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

type ConfirmAction = { type: "assign" | "remove"; user: AppUser } | null;

export default function SuperAdminDashboardPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async (signal?: AbortSignal) => {
    setLoadingUsers(true);
    try {
      const data = await SuperAdminAPI.listAllUsers();
      if (!signal?.aborted) setAllUsers(data);
    } catch (error) {
      if (isAbortError(error)) return;
      toast.error(getErrorMessage(error, "Не удалось загрузить пользователей"));
    } finally {
      if (!signal?.aborted) setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, []);

  if (!user) return null;

  const rootAdmins = allUsers.filter((u) => u.role === "admin-po");
  const sellers = allUsers.filter((u) => u.role === "seller");
  const activeUsers = allUsers.filter((u) => u.isActive !== false);

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return u.role !== "admin-po" && u.role !== "superadmin";
    return (
      (u.name.toLowerCase().includes(q) || u.externalSystemId.toLowerCase().includes(q)) &&
      u.role !== "superadmin"
    );
  });

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "assign") {
        await SuperAdminAPI.assignRootAdmin(confirmAction.user.id);
        toast.success(`${confirmAction.user.name} назначен Администратором ПО`);
      } else {
        await SuperAdminAPI.removeRootAdmin(confirmAction.user.id);
        toast.success(`Роль Администратора ПО снята с ${confirmAction.user.name}`);
      }
      setConfirmAction(null);
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось выполнить действие"));
    } finally {
      setActionLoading(false);
    }
  };

  const globalStats = [
    { label: "Всего пользователей", value: allUsers.length, icon: Users, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Активных", value: activeUsers.length, icon: Globe, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Продавцов", value: sellers.length, icon: Building2, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Администраторов ПО", value: rootAdmins.length, icon: Shield, color: "#F5A623", bg: "#FFFBEB" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #C41E3A 0%, #A3152E 100%)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={44} />
            <div>
              <div className="flex items-center gap-1">
                <Crown size={14} color="#FFD700" />
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>СуперАдмин</p>
              </div>
              <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.16)" }}
            aria-label="Выйти из аккаунта"
          >
            <LogOut size={18} color="#fff" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {globalStats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.bg }}
              >
                <s.icon size={20} color={s.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {loadingUsers ? "—" : s.value}
              </p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Current root_admins */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Администраторы ПО</h3>
            <Shield size={18} color="#C41E3A" />
          </div>
          {loadingUsers ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Загрузка...</p>
          ) : rootAdmins.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Нет назначенных администраторов ПО</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rootAdmins.map((ra) => (
                <div
                  key={ra.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: "#FEF9F0" }}
                >
                  <Avatar name={ra.name} size={36} src={ra.avatar} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{ra.name}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>{ra.externalSystemId}</p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({ type: "remove", user: ra })}
                    className="p-2 rounded-lg"
                    style={{ background: "#FEF2F2" }}
                    aria-label="Снять роль Admin PO"
                    title="Снять роль Admin PO"
                  >
                    <UserMinus size={15} color="#DC2626" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign root_admin section */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 10 }}>
            Назначить Администратора ПО
          </h3>
          <div className="relative mb-3">
            <Search size={14} color="#94A3B8" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО или ID..."
              className="w-full h-9 pl-8 pr-3 rounded-lg outline-none"
              style={{ background: "#F1F5F9", fontSize: 13, color: "#1E293B" }}
            />
          </div>
          {loadingUsers ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>Загрузка...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: "#94A3B8", fontSize: 13 }}>
              {searchQuery ? "Нет совпадений" : "Введите имя или ID для поиска"}
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {filteredUsers.slice(0, 20).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{ background: "#F8FAFC" }}
                >
                  <Avatar name={u.name} size={34} src={u.avatar} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{u.name}</p>
                    <p style={{ color: "#94A3B8", fontSize: 11 }}>
                      {ROLE_LABELS_SHORT[u.role] || u.role} · {u.externalSystemId}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({ type: "assign", user: u })}
                    className="p-2 rounded-lg"
                    style={{ background: "#E8F5E9" }}
                    aria-label="Назначить Admin PO"
                    title="Назначить Admin PO"
                  >
                    <UserCheck size={15} color="#2E7D32" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "assign"
                ? "Назначить Администратора ПО?"
                : "Снять роль Администратора ПО?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction && (
                <>
                  Пользователь: <strong>{confirmAction.user.name}</strong>
                  <br />
                  {confirmAction.type === "assign"
                    ? "Пользователь получит полный административный доступ ко всем модулям."
                    : "Пользователь будет понижен до роли «Продавец»."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={actionLoading}
            >
              Отмена
            </Button>
            <Button
              variant={confirmAction?.type === "remove" ? "destructive" : "default"}
              onClick={() => void handleConfirm()}
              disabled={actionLoading}
            >
              {actionLoading ? "Выполняется..." : "Подтвердить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
