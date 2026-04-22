import { useNavigate } from "react-router";
import { BookOpen } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";

export default function TestListPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Тесты" showBack backTo="/seller/knowledge" white />

      <div className="px-4 py-8 flex flex-col items-center justify-center text-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "#E8F5E9" }}
        >
          <BookOpen size={28} color="#2E7D32" />
        </div>
        <div>
          <p style={{ color: "#1E293B", fontSize: 17, fontWeight: 600 }}>
            Тесты доступны внутри курсов
          </p>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 6, maxWidth: 320 }}>
            Выберите курс в разделе «Обучение», чтобы посмотреть его материалы и пройти тесты.
          </p>
        </div>
        <button
          onClick={() => navigate("/seller/knowledge")}
          className="h-11 px-5 rounded-[10px] flex items-center justify-center"
          style={{ background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 600 }}
        >
          Перейти к курсам
        </button>
      </div>
    </div>
  );
}
