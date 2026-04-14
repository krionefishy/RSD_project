// React import not needed in React 18+
import { useNavigate } from "react-router";
import {
  Calendar,
  Plane,
  Info,
  LogOut,
  ChevronRight,
  Camera,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

const menuItems = [
  { icon: Calendar, label: "Моё расписание", path: "/seller/schedule", color: "#2E7D32" },
  { icon: Plane, label: "Мои отпуска и отгулы", path: "", color: "#C41E3A" },
  { icon: Info, label: "О приложении", path: "", color: "#64748B" },
];

export default function ProfilePage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Profile header */}
      <div
        className="px-4 pt-8 pb-6 flex flex-col items-center"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <div className="relative">
          <Avatar name={user.name} size={80} />
          <button
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#fff" }}
          >
            <Camera size={14} color="#2E7D32" />
          </button>
        </div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 12 }}>{user.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>{user.position}</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 }}>{user.store}</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Info */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {[
            { label: "Email", value: user.email },
            { label: "Телефон", value: user.phone },
            { label: "Блок", value: user.block },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: i < 2 ? "1px solid #F1F5F9" : "none" }}
            >
              <span style={{ color: "#64748B", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => item.path && navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: i < menuItems.length - 1 ? "1px solid #F1F5F9" : "none" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.color + "15" }}
              >
                <item.icon size={18} color={item.color} />
              </div>
              <span style={{ color: "#1E293B", fontSize: 14, fontWeight: 500, flex: 1, textAlign: "left" }}>
                {item.label}
              </span>
              <ChevronRight size={16} color="#CBD5E1" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/"); }}
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
