import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

export default function AdminPOProfilePage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-8 pb-6 flex flex-col items-center"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <Avatar name={user.name} size={72} />
        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginTop: 12 }}>{user.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Администратор ПО</p>
      </div>
      <div className="px-4 py-4">
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2"
          style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 14, fontWeight: 600 }}
        >
          <LogOut size={18} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
