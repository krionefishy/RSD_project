import { Database, Server, HardDrive } from "lucide-react";
import { showDemoActionToast } from "../../utils/demoToast";

const ITEMS = [
  { title: "Синхронизация справочников", desc: "Последняя: сегодня 08:00", icon: Database },
  { title: "Репликация БД", desc: "Статус: активна", icon: Server },
  { title: "Хранилище вложений", desc: "Занято 42% (128 ГБ)", icon: HardDrive },
];

export default function AdminPODataPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-4" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Данные системы</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>
          Мониторинг и обслуживание
        </p>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">
        {ITEMS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => showDemoActionToast()}
            className="rounded-2xl p-4 text-left w-full"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <item.icon size={20} color="#2E7D32" />
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{item.title}</p>
                <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{item.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
