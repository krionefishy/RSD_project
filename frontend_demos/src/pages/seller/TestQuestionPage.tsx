import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { APIError } from "../../api/APIClient";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { PageLoader } from "../../components/PageLoader";
import { TestTask } from "../../types/knowledge";

interface TestState {
  testName: string;
  tasksCount: number;
  currentTask: TestTask;
  currentIndex: number;
}

export default function TestQuestionPage() {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const testIdNum = Number(testId);
  const courseId = Number(searchParams.get("course_id"));

  const [state, setState] = useState<TestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(testIdNum) || !Number.isFinite(courseId)) {
      setError("Некорректные параметры теста");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    KnowledgeAPI.startTest(courseId, testIdNum)
      .then((result) => {
        if (cancelled) return;
        setState({
          testName: result.testName,
          tasksCount: result.tasksCount,
          currentTask: result.firstTask,
          currentIndex: 0,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof APIError ? err.message : "Не удалось начать тест";
        setError(message);
        setLoading(false);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, testIdNum]);

  const handleSubmit = async () => {
    if (!state || selected === null || submitting) return;
    setSubmitting(true);
    try {
      const result = await KnowledgeAPI.submitAnswer(
        courseId,
        testIdNum,
        state.currentTask.id,
        selected,
      );
      if (result.isTestCompleted || !result.nextTask) {
        navigate(`/seller/tests/${testIdNum}/result?course_id=${courseId}`);
        return;
      }
      setState({
        testName: state.testName,
        tasksCount: state.tasksCount,
        currentTask: result.nextTask,
        currentIndex: state.currentIndex + 1,
      });
      setSelected(null);
    } catch (err) {
      const message = err instanceof APIError ? err.message : "Не удалось отправить ответ";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader fullScreen message="Запуск теста..." />;
  }

  if (error || !state) {
    return (
      <div
        style={{
          background: "#F8FAFC",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="text-center px-6">
          <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {error ?? "Тест недоступен"}
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{ color: "#2E7D32", fontSize: 14, fontWeight: 500 }}
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  const q = state.currentTask;
  const questionNumber = state.currentIndex + 1;
  const progress = (questionNumber / state.tasksCount) * 100;
  const isLast = questionNumber >= state.tasksCount;

  return (
    <div
      style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <div
        className="px-4 pt-4 pb-3"
        style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}
      >
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)}>
            <X size={22} color="#64748B" />
          </button>
          <div>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
              {state.testName}
            </p>
            <p style={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>
              Вопрос {questionNumber} из {state.tasksCount}
            </p>
          </div>
          <div style={{ width: 22 }} />
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#2E7D32" }}
          />
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-4">
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
            {q.name}
          </p>
          {q.description && (
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 8 }}>{q.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {q.answerVariants.map((option, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                style={{
                  background: isSelected ? "#E8F5E9" : "#fff",
                  border: `2px solid ${isSelected ? "#2E7D32" : "#E2E8F0"}`,
                  transition: "all 0.15s",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: `2px solid ${isSelected ? "#2E7D32" : "#CBD5E1"}`,
                    background: isSelected ? "#2E7D32" : "transparent",
                  }}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />
                  )}
                </div>
                <span
                  style={{
                    color: isSelected ? "#2E7D32" : "#374151",
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    lineHeight: 1.4,
                  }}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-6 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
        <button
          onClick={() => void handleSubmit()}
          disabled={selected === null || submitting}
          className="w-full h-12 rounded-[10px] flex items-center justify-center"
          style={{
            background: selected !== null && !submitting ? "#2E7D32" : "#E2E8F0",
            color: selected !== null && !submitting ? "#fff" : "#94A3B8",
            fontSize: 15,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          {submitting ? "Сохранение..." : isLast ? "Завершить тест" : "Следующий вопрос →"}
        </button>
      </div>
    </div>
  );
}
