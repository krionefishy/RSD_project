import { useState } from "react";
import { Globe, ChevronRight, Palette, Shield, Smartphone } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";

export default function SuperAdminSettingsPage() {
  const [toggles, setToggles] = useState({
    darkMode: false,
    autoBackup: true,
    twoFactor: true,
    maintenance: false,
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    { id: "appearance", icon: Palette, label: "Внешний вид", items: [
      { label: "Тёмная тема", action: () => toggle("darkMode"), value: toggles.darkMode ? "Вкл" : "Выкл", toggle: true, active: toggles.darkMode },
      { label: "Цветовая схема", action: () => {}, value: "Фирменная" },
    ]},
    { id: "security", icon: Shield, label: "Безопасность", items: [
      { label: "Двухфакторная аутентификация", action: () => toggle("twoFactor"), value: toggles.twoFactor ? "Вкл" : "Выкл", toggle: true, active: toggles.twoFactor },
      { label: "Сменить пароль", action: () => {}, value: "" },
      { label: "Сессии", action: () => {}, value: "3 активных" },
    ]},
    { id: "system", icon: Globe, label: "Система", items: [
      { label: "Автоматический бэкап", action: () => toggle("autoBackup"), value: toggles.autoBackup ? "Вкл" : "Выкл", toggle: true, active: toggles.autoBackup },
      { label: "Режим обслуживания", action: () => toggle("maintenance"), value: toggles.maintenance ? "Вкл" : "Выкл", toggle: true, active: toggles.maintenance },
    ]},
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Настройки" showBack />

      <div className="px-4 py-4 flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="px-4 py-3 border-b border-[#F1F5F9]" style={{ background: "#F8FAFC" }}>
              <div className="flex items-center gap-2">
                <section.icon size={18} color="#C41E3A" />
                <span style={{ color: "#C41E3A", fontSize: 13, fontWeight: 600 }}>{section.label}</span>
              </div>
            </div>
            {section.items.map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center justify-between px-4 py-4"
                style={{ borderBottom: i < section.items.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <span style={{ color: "#1E293B", fontSize: 15 }}>{item.label}</span>
                {item.toggle ? (
                  <div className="w-11 h-6 rounded-full relative" style={{ background: item.active ? "#C41E3A" : "#E2E8F0", transition: "all 0.2s" }}>
                    <div className="absolute top-1 w-4 h-4 rounded-full bg-white" style={{ left: item.active ? "26px" : "6px", transition: "all 0.2s" }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {item.value && <span style={{ color: "#94A3B8", fontSize: 14 }}>{item.value}</span>}
                    <ChevronRight size={20} color="#94A3B8" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={20} color="#64748B" />
              <span style={{ color: "#1E293B", fontSize: 15 }}>Версия приложения</span>
            </div>
            <span style={{ color: "#64748B", fontSize: 14 }}>1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
