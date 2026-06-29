// React import not needed in React 18+
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { ScreenBackButton } from "../../components/ScreenBackButton";
import { EditablePhoneField } from "../../components/profile/EditablePhoneField";

export default function ManagerProfilePage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-6 flex flex-col items-center" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <ScreenBackButton to="/manager" light className="self-start mb-4" />
        <Avatar name={user.name} size={72} src={user.avatar} />
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 12 }}>{user.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{user.position}</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{user.blockName ?? user.block}</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {[{ label: "ID сотрудника", value: user.externalSystemId }, { label: "Блок", value: user.blockName ?? user.block }].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <span style={{ color: "#64748B", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
          <EditablePhoneField />
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2" style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 14, fontWeight: 600 }}>
          <LogOut size={18} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
