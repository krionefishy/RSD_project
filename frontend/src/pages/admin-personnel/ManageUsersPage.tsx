import { useEffect, useState } from "react";
import { Search, ChevronRight, UserCog, Lock, MapPin } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { UserAPI, AppUser } from "../../api/UserAPI";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { ROLE_LABELS_SHORT } from "../../constants/roles";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

export default function ManageUsersPage() {
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    position: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    async function loadUsers() {
      try {
        const data = await UserAPI.listUsers(undefined, controller.signal);
        setUsers(data);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить список пользователей"));
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
    return () => controller.abort();
  }, []);

  const filtered = users.filter((u) => {
    const matchQuery = u.name.toLowerCase().includes(query.toLowerCase()) ||
                      u.externalSystemId.toLowerCase().includes(query.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchQuery && matchRole;
  });

  const handleEditClick = (user: AppUser) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      position: user.position || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      await AdminStaffAPI.updateUser(selectedUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        position: editForm.position,
      });
      toast.success("Данные пользователя обновлены");
      setShowEditModal(false);
      const updated = await UserAPI.listUsers();
      setUsers(updated);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось обновить данные"));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const result = await AdminStaffAPI.resetPassword(selectedUser.id);
      setTempPassword(result.temporaryPassword);
      toast.success("Пароль сброшен");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сбросить пароль"));
    }
  };

  const handleAssignLocation = async (locationId: string) => {
    if (!selectedUser) return;
    try {
      await AdminStaffAPI.assignLocation(selectedUser.id, locationId);
      toast.success("Локация назначена");
      setShowLocationModal(false);
      const updated = await UserAPI.listUsers();
      setUsers(updated);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось назначить локацию"));
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Управление пользователями</h1>
        <div className="mt-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search size={16} color="#94A3B8" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени или ID..."
            className="w-full h-10 pl-9 pr-4 rounded-xl outline-none"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 14 }}
          />
        </div>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ borderBottom: "1px solid #E2E8F0", background: "#fff", scrollbarWidth: "none" }}>
        {["all", "seller", "manager", "admin-edu", "admin-sales", "admin-personnel", "superadmin"].map((role) => (
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

      {/* User list */}
      <div className="px-4 py-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          {loading ? "Загрузка..." : `${filtered.length} пользователей`}
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {loading ? (
            <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
              Загрузка пользователей...
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
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <Avatar name={user.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{user.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>{ROLE_LABELS_SHORT[user.role] || user.role}</p>
                  <p style={{ color: "#64748B", fontSize: 11 }}>{user.externalSystemId}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="p-2 rounded-lg"
                    style={{ background: "#F1F5F9" }}
                  >
                    <UserCog size={16} color="#64748B" />
                  </button>
                  <button
                    onClick={() => { setSelectedUser(user); setShowPasswordModal(true); setTempPassword(""); }}
                    className="p-2 rounded-lg"
                    style={{ background: "#F1F5F9" }}
                  >
                    <Lock size={16} color="#64748B" />
                  </button>
                  <button
                    onClick={() => { setSelectedUser(user); setShowLocationModal(true); }}
                    className="p-2 rounded-lg"
                    style={{ background: "#F1F5F9" }}
                  >
                    <MapPin size={16} color="#64748B" />
                  </button>
                  <ChevronRight size={15} color="#CBD5E1" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Редактирование</h3>
            <div className="flex flex-col gap-3">
              <input
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="Имя"
                className="w-full h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
              <input
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Фамилия"
                className="w-full h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Телефон"
                className="w-full h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
              <input
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                placeholder="Должность"
                className="w-full h-10 px-3 rounded-lg border"
                style={{ borderColor: "#E2E8F0", fontSize: 14 }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14, fontWeight: 500 }}
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 500 }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Сброс пароля</h3>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>
              Пользователь: <strong>{selectedUser.name}</strong>
            </p>
            {tempPassword ? (
              <div className="p-3 rounded-lg mb-4" style={{ background: "#F0FDF4" }}>
                <p style={{ color: "#166534", fontSize: 12, marginBottom: 4 }}>Временный пароль:</p>
                <p style={{ color: "#166534", fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>{tempPassword}</p>
              </div>
            ) : (
              <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
                Будет сгенерирован временный пароль, который нужно будет передать пользователю.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14, fontWeight: 500 }}
              >
                Закрыть
              </button>
              {!tempPassword && (
                <button
                  onClick={handleResetPassword}
                  className="flex-1 h-10 rounded-lg"
                  style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 500 }}
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Назначение локации</h3>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 16 }}>
              Пользователь: <strong>{selectedUser.name}</strong>
            </p>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
              Текущая локация: {selectedUser.store || "Не назначена"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14, fontWeight: 500 }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleAssignLocation("loc-001")}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 500 }}
              >
                Назначить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
