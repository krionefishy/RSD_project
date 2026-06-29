// React import not needed in React 18+
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  LogOut,
  ChevronRight,
  Camera,
  Wallet,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { UserAPI } from "../../api/UserAPI";
import { toast } from "sonner";
import type { EmployeeCompensation } from "../../types/profile";
import { isPresentationMode } from "../../config/presentationMode";
import { EditablePhoneField } from "../../components/profile/EditablePhoneField";
import { AVATAR_ACCEPT, mapAvatarErrorMessage, validateAvatarFile } from "../../utils/avatar";

const menuItems = [
  { icon: Calendar, label: "Моё расписание", path: "/seller/schedule", color: "#2E7D32" },
];

function formatMoney(value?: string): string {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export default function ProfilePage() {
  const { user, logout, setUser } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [compensation, setCompensation] = useState<EmployeeCompensation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void UserAPI.getOwnCompensation(controller.signal)
      .then(setCompensation)
      .catch(() => setCompensation(null));
    return () => controller.abort();
  }, []);

  if (!user) return null;

  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setAvatarUploading(true);
    try {
      const result = await UserAPI.uploadOwnAvatar(file);
      setUser({ ...user, avatar: result.avatarUrl });
      toast.success(isPresentationMode() ? "Демо: аватар обновлён локально" : "Аватар обновлён");
    } catch (error) {
      toast.error(mapAvatarErrorMessage(error));
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Profile header */}
      <div
        className="px-4 pt-8 pb-6 flex flex-col items-center"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <div className="relative">
          <Avatar name={user.name} size={80} src={user.avatar} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "#fff", opacity: avatarUploading ? 0.7 : 1 }}
            aria-label="Загрузить аватар"
          >
            <Camera size={14} color="#2E7D32" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarChange(file);
              e.target.value = "";
            }}
          />
        </div>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 12 }}>{user.name}</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 }}>{user.position}</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 1 }}>{user.storeName ?? user.store}</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Info */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {[
            { label: "ID сотрудника", value: user.externalSystemId },
            { label: "Блок", value: user.blockName ?? user.block },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid #F1F5F9" }}
            >
              <span style={{ color: "#64748B", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
          <EditablePhoneField />
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
              <Wallet size={18} color="#15803D" />
            </div>
            <div>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>Мотивация</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Оклад и ставки</p>
            </div>
          </div>
          {compensation ? (
            [
              { label: "Оклад", value: formatMoney(compensation.baseSalary) },
              { label: "Часовая ставка", value: formatMoney(compensation.hourlyRate) },
              { label: "Ночная ставка", value: formatMoney(compensation.effectiveNightHourlyRate) },
            ].map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: index < 2 ? "1px solid #F1F5F9" : "none" }}
              >
                <span style={{ color: "#64748B", fontSize: 13 }}>{item.label}</span>
                <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3">
              <span style={{ color: "#94A3B8", fontSize: 13 }}>Данные по мотивации пока недоступны</span>
            </div>
          )}
        </div>

        {/* Menu */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {menuItems
            .filter((item) => !isPresentationMode() || item.path)
            .map((item, i, arr) => (
            <button
              key={i}
              onClick={() => {
                navigate(item.path);
              }}
              className="w-full flex items-center gap-3 px-4 py-4"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}
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
