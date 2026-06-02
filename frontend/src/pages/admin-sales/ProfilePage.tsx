import { ChevronLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { ROLE_LABELS } from "../../constants/roles";

export default function AdminSalesProfilePage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          type="button"
          onClick={() => navigate("/admin-sales")}
          className="flex items-center gap-1 mb-4"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Назад
        </button>
        <div className="flex flex-col items-center">
          <Avatar name={user.name} size={72} />
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 600, marginTop: 12 }}>{user.name}</p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
            {ROLE_LABELS[user.role] ?? user.position}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 14, fontWeight: 500 }}
        >
          <LogOut size={18} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
