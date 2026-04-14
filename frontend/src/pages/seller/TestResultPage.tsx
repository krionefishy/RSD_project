import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ProgressCircle } from "../../components/ProgressCircle";
import { CheckCircle, XCircle, RotateCcw, List } from "lucide-react";

export default function TestResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { score: number; correct: number; total: number } | null;

  const score = state?.score ?? 72;
  const correct = state?.correct ?? 4;
  const total = state?.total ?? 5;
  const passed = score >= 70;

  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimScore(score);
        clearInterval(timer);
      } else {
        setAnimScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const color = passed ? "#22C55E" : "#EF4444";

  return (
    <div
      style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Colored banner */}
      <div
        className="flex flex-col items-center justify-center px-6 py-10"
        style={{ background: `linear-gradient(160deg, ${color}22 0%, ${color}11 100%)` }}
      >
        <ProgressCircle
          value={animScore}
          size={160}
          strokeWidth={14}
          color={color}
          trackColor="#E2E8F0"
        >
          <div className="text-center">
            <span style={{ fontSize: 40, fontWeight: 800, color: "#1E293B", lineHeight: 1 }}>
              {animScore}%
            </span>
          </div>
        </ProgressCircle>

        <div className="flex items-center gap-2 mt-5">
          {passed ? (
            <CheckCircle size={24} color="#22C55E" />
          ) : (
            <XCircle size={24} color="#EF4444" />
          )}
          <h2
            style={{
              color: "#1E293B",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {passed ? "Тест пройден!" : "Попробуйте ещё раз"}
          </h2>
        </div>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 6, textAlign: "center" }}>
          {passed
            ? "Отличный результат! Вы успешно завершили тест."
            : `Для сдачи теста необходимо ${70}%. Вы набрали ${score}%.`}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-5 flex flex-col gap-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
            Результаты теста
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "#F8FAFC" }}
            >
              <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 700 }}>{total}</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Вопросов</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "#F0FDF4" }}
            >
              <p style={{ color: "#22C55E", fontSize: 22, fontWeight: 700 }}>{correct}</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Верных</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: "#FEF2F2" }}
            >
              <p style={{ color: "#EF4444", fontSize: 22, fontWeight: 700 }}>{total - correct}</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Ошибок</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span style={{ color: "#64748B", fontSize: 12 }}>Ваш результат</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>Проходной балл: 70%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden relative" style={{ background: "#E2E8F0" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${score}%`, background: color, transition: "width 1s ease" }}
              />
              {/* Threshold marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{ left: "70%", background: "#64748B", opacity: 0.5 }}
              />
            </div>
          </div>
        </div>

        {passed && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
          >
            <div style={{ fontSize: 24 }}>✅</div>
            <div>
              <p style={{ color: "#15803D", fontSize: 14, fontWeight: 600 }}>
                Тест успешно сдан
              </p>
              <p style={{ color: "#16A34A", fontSize: 12 }}>
                Результат зафиксирован в вашем профиле
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="px-4 pb-8 pt-2 flex flex-col gap-2 mt-auto">
        {!passed && (
          <button
            onClick={() => navigate(-1)}
            className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#2E7D32", color: "#fff", fontSize: 15, fontWeight: 600 }}
          >
            <RotateCcw size={18} />
            Пройти заново
          </button>
        )}
        <button
          onClick={() => navigate("/seller/tests")}
          className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2"
          style={{
            background: passed ? "#2E7D32" : "#fff",
            color: passed ? "#fff" : "#374151",
            fontSize: 15,
            fontWeight: 600,
            border: passed ? "none" : "1.5px solid #E2E8F0",
          }}
        >
          <List size={18} />
          К списку тестов
        </button>
      </div>
    </div>
  );
}
