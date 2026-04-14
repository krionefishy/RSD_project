import { useNavigate } from "react-router";
import { CheckCircle, RotateCcw, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { tests } from "../../mock/mockData";

const statusConfig = {
  passed: { label: "Пройден", icon: <CheckCircle size={15} color="#22C55E" />, color: "#22C55E", bg: "#F0FDF4" },
  assigned: { label: "Назначен", icon: <AlertCircle size={15} color="#2E7D32" />, color: "#2E7D32", bg: "#E8F5E9" },
  repeat: { label: "Повторный", icon: <RotateCcw size={15} color="#EF4444" />, color: "#EF4444", bg: "#FEF2F2" },
  "not-assigned": { label: "Не назначен", icon: <Clock size={15} color="#94A3B8" />, color: "#94A3B8", bg: "#F1F5F9" },
};

export default function TestListPage() {
  const navigate = useNavigate();

  const assigned = tests.filter((t) => t.status === "assigned" || t.status === "repeat");
  const done = tests.filter((t) => t.status === "passed");

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Тесты" showBack backTo="/seller/knowledge" white />

      <div className="px-4 py-4">
        {/* Assigned */}
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          К выполнению ({assigned.length})
        </p>
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {assigned.map((test, i) => {
            const status = statusConfig[test.status];
            return (
              <button
                key={test.id}
                onClick={() => navigate(`/seller/tests/${test.id}`)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
                style={{ borderBottom: i < assigned.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: status.bg }}
                >
                  {status.icon}
                </div>
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>
                    {test.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ color: "#94A3B8", fontSize: 12 }}>{test.questionsCount} вопросов</span>
                  </div>
                  {test.deadline && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle size={11} color="#F59E0B" />
                      <span style={{ color: "#F59E0B", fontSize: 11, fontWeight: 500 }}>
                        До {test.deadline}
                      </span>
                    </div>
                  )}
                  {test.status === "repeat" && test.score && (
                    <span style={{ color: "#EF4444", fontSize: 11, fontWeight: 500 }}>
                      Прошлый результат: {test.score}%
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 600 }}
                  >
                    {status.label}
                  </span>
                  <ChevronRight size={15} color="#CBD5E1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Passed */}
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>
          Пройденные ({done.length})
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {done.map((test, i) => {
            const status = statusConfig[test.status];
            return (
              <div
                key={test.id}
                className="flex items-center gap-3 px-4 py-4"
                style={{ borderBottom: i < done.length - 1 ? "1px solid #F1F5F9" : "none" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: status.bg }}
                >
                  {status.icon}
                </div>
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{test.title}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>{test.questionsCount} вопросов</p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2.5 py-1 rounded-full"
                    style={{ background: "#F0FDF4", color: "#16A34A", fontSize: 12, fontWeight: 600 }}
                  >
                    {test.score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
