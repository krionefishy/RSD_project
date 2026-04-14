import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { X } from "lucide-react";
import { tests, testQuestions } from "../../mock/mockData";

export default function TestQuestionPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const test = tests.find((t: any) => t.id === testId);
  const questions = testQuestions;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const finishTest = useCallback(() => {
    const currentAnswers = answersRef.current;
    const correct = Object.entries(currentAnswers).filter(([qi, ai]) => {
      const q = questions[Number(qi)];
      return q && q.correct === ai;
    }).length;
    const score = Math.round((correct / questions.length) * 100);
    navigate(`/seller/tests/${testId}/result`, { state: { score, correct, total: questions.length } });
  }, [questions, testId, navigate]);

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      finishTest();
    }
  };

  if (!test || questions.length === 0) {
    return (
      <div style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center px-6">
          <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Тест не найден</p>
          <button onClick={() => navigate(-1)} style={{ color: "#1A56DB", fontSize: 14, fontWeight: 500 }}>← Назад к тестам</button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div
      style={{ background: "#F8FAFC", minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: "#fff", borderBottom: "1px solid #F1F5F9" }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)}>
            <X size={22} color="#64748B" />
          </button>
          <div>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
              {test?.title || "Тест"}
            </p>
            <p style={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>
              Вопрос {currentQ + 1} из {questions.length}
            </p>
          </div>
          <div style={{ width: 22 }} />
        </div>

        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#1A56DB" }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 pt-6 pb-4">
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <p style={{ color: "#1E293B", fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
            {q.text}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((option, i) => {
            const selected = answers[currentQ] === i;
            return (
              <button
                key={i}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: i }))}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left"
                style={{
                  background: selected ? "#EFF6FF" : "#fff",
                  border: `2px solid ${selected ? "#1A56DB" : "#E2E8F0"}`,
                  transition: "all 0.15s",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    border: `2px solid ${selected ? "#1A56DB" : "#CBD5E1"}`,
                    background: selected ? "#1A56DB" : "transparent",
                  }}
                >
                  {selected && (
                    <div className="w-2 h-2 rounded-full" style={{ background: "#fff" }} />
                  )}
                </div>
                <span
                  style={{
                    color: selected ? "#1A56DB" : "#374151",
                    fontSize: 14,
                    fontWeight: selected ? 500 : 400,
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

      {/* Bottom button */}
      <div className="px-4 pb-6 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
        <button
          onClick={handleNext}
          disabled={answers[currentQ] === undefined}
          className="w-full h-12 rounded-[10px] flex items-center justify-center"
          style={{
            background: answers[currentQ] !== undefined ? "#1A56DB" : "#E2E8F0",
            color: answers[currentQ] !== undefined ? "#fff" : "#94A3B8",
            fontSize: 15,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          {currentQ < questions.length - 1 ? "Следующий вопрос →" : "Завершить тест"}
        </button>
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ((q) => q - 1)}
            className="w-full h-10 mt-2 flex items-center justify-center"
            style={{ color: "#64748B", fontSize: 14 }}
          >
            ← Назад
          </button>
        )}
      </div>
    </div>
  );
}
