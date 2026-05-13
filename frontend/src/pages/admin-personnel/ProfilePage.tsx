import { useEffect, useState } from "react";
import { ChevronLeft, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Avatar } from "../../components/Avatar";
import { UserAPI, AppUser } from "../../api/UserAPI";
import { useApp } from "../../context/AppContext";
import { ROLE_LABELS } from "../../constants/roles";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: contextUser } = useApp();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const data = await UserAPI.fetchMe(controller.signal);
        setUser(data);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить профиль"));
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, []);

  const displayUser = user || contextUser;

  if (!displayUser) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 mb-4"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Назад
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={displayUser.name} size={64} />
          <div>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{displayUser.name}</p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
              {ROLE_LABELS[displayUser.role] || displayUser.role}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Info card */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Контактная информация</h3>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <Phone size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>Телефон</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                {displayUser.phone || "Не указан"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <Mail size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>ID в системе</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                {displayUser.externalSystemId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <Building2 size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>Блок</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                {displayUser.block || "Не назначен"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <MapPin size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>Локация</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                {displayUser.store || "Не назначена"}
              </p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Информация об аккаунте</h3>
          
          <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ color: "#64748B", fontSize: 13 }}>Роль</span>
            <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>
              {ROLE_LABELS[displayUser.role] || displayUser.role}
            </span>
          </div>
          
          <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ color: "#64748B", fontSize: 13 }}>Статус</span>
            <span style={{ color: "#22C55E", fontSize: 13, fontWeight: 500 }}>Активен</span>
          </div>
          
          <div className="flex justify-between py-2">
            <span style={{ color: "#64748B", fontSize: 13 }}>ID пользователя</span>
            <span style={{ color: "#1E293B", fontSize: 13, fontFamily: "monospace" }}>
              {displayUser.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Загрузка данных...</p>
          </div>
        )}
      </div>
    </div>
  );
}
