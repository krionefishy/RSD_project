import { LogOut, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../Avatar";
import { ScreenBackButton } from "../ScreenBackButton";
import { ROLE_LABELS } from "../../constants/roles";
interface AccountProfileViewProps {
  backTo: string;
  roleLabel?: string;
}

export function AccountProfileView({ backTo, roleLabel }: AccountProfileViewProps) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  const displayRole = roleLabel ?? ROLE_LABELS[user.role] ?? user.position ?? user.role;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <ScreenBackButton to={backTo} light className="mb-4" />
        <div className="flex flex-col items-center">
          <Avatar name={user.name} size={72} />
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 600, marginTop: 12 }}>{user.name}</p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{displayRole}</p>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>О себе</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <Phone size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>Телефон</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{user.phone || "Не указан"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
              <Mail size={18} color="#2E7D32" />
            </div>
            <div>
              <p style={{ color: "#64748B", fontSize: 12 }}>ID в системе</p>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{user.externalSystemId}</p>
            </div>
          </div>
        </div>

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
