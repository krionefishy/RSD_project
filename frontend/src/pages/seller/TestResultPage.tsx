import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ProgressCircle } from "../../components/ProgressCircle";
import { CheckCircle, XCircle, RotateCcw, List } from "lucide-react";
import { toast } from "sonner";
import { APIError } from "../../api/APIClient";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { PageLoader } from "../../components/PageLoader";
import { TestResult } from "../../types/knowledge";

export default function TestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testIdNum = Number(testId);
  const courseId = Number(searchParams.get("course_id"));

  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(testIdNum) || !Number.isFinite(courseId)) {
      setError("Некорректные параметры теста");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    KnowledgeAPI.getTestResult(testIdNum, courseId)
      .then((res) => {
        if (!cancelled) {
          setResult(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось загрузить результат";
        setError(message);
        setLoading(false);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, testIdNum]);

  useEffect(() => {
    if (!result) return;
    const target = Math.round(result.percentage);
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimScore(target);
        clearInterval(timer);
      } else {
        setAnimScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [result]);

  if (loading) {
    return <PageLoader fullScreen message="Загрузка результата..." />;
  }

  if (error || !result) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "24px 16px" }}>
        <p style={{ color: "#DC2626", fontSize: 14 }}>{error ?? "Результат не найден"}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4"
          style={{ color: "#2E7D32", fontSize: 14, fontWeight: 500 }}
        >
          ← Назад
        </button>
      </div>
    );
  }

  const passed = result.isPassed;
  const color = passed ? "#22C55E" : "#EF4444";
  const percent = Math.round(result.percentage);
  const totalAnswered = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  return (
    <div
      style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
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
          {passed ? <CheckCircle size={24} color="#22C55E" /> : <XCircle size={24} color="#EF4444" />}
          <h2 style={{ color: "#1E293B", fontSize: 22, fontWeight: 700 }}>
            {passed ? "Тест пройден!" : "Попробуйте ещё раз"}
          </h2>
        </div>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 6, textAlign: "center" }}>
          {passed
            ? "Отличный результат! Вы успешно завершили тест."
            : `Вы набрали ${percent}%. Для сдачи требуется пройти повторно.`}
        </p>
      </div>

      <div className="px-4 py-5 flex flex-col gap-3">
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
            {result.testName}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "#F8FAFC" }}>
              <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 700 }}>{result.maxScore}</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Максимум</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#F0FDF4" }}>
              <p style={{ color: "#22C55E", fontSize: 22, fontWeight: 700 }}>{result.score}</p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Баллов</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "#FEF2F2" }}>
              <p style={{ color: "#EF4444", fontSize: 22, fontWeight: 700 }}>
                {Math.max(0, result.maxScore - result.score)}
              </p>
              <p style={{ color: "#64748B", fontSize: 12 }}>Потеряно</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span style={{ color: "#64748B", fontSize: 12 }}>Ваш результат</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>Итог: {totalAnswered}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden relative" style={{ background: "#E2E8F0" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, background: color, transition: "width 1s ease" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 pt-2 flex flex-col gap-2 mt-auto">
        {!passed && (
          <button
            onClick={() => navigate(`/seller/tests/${testIdNum}?course_id=${courseId}`, { replace: true })}
            className="w-full h-12 rounded-[10px] flex items-center justify-center gap-2"
            style={{ background: "#2E7D32", color: "#fff", fontSize: 15, fontWeight: 600 }}
          >
            <RotateCcw size={18} />
            Пройти заново
          </button>
        )}
        <button
          onClick={() => navigate(`/seller/knowledge/${courseId}`)}
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
          К курсу
        </button>
      </div>
    </div>
  );
}
