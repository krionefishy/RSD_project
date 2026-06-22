import { useState } from "react";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { KnowledgeAPI } from "../../api/KnowledgeAPI";
import { toast } from "sonner";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
}

export default function CreateTestPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [passScorePercent, setPassScorePercent] = useState<string>("70");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "", options: ["", ""], correct: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { id: questions.length + 1, text: "", options: ["", "", ""], correct: 0 }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: number, field: keyof Question, value: string | number) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qId: number, optIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((opt, i) => (i === optIndex ? value : opt)) } : q
      )
    );
  };

  const addOption = (qId: number) => {
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, options: [...q.options, ""] } : q)));
  };

  const removeOption = (qId: number, optIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optIndex), correct: q.correct >= optIndex && q.correct > 0 ? q.correct - 1 : q.correct }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Введите название теста");
      return;
    }
    if (!category.trim()) {
      toast.error("Введите категорию теста");
      return;
    }
    const invalidQ = questions.findIndex((q) => !q.text.trim() || q.options.some((o) => !o.trim()));
    if (invalidQ >= 0) {
      toast.error(`Заполните вопрос ${invalidQ + 1} и все варианты ответов`);
      return;
    }

    setSaving(true);
    try {
      const test = await KnowledgeAPI.createTest({
        name: title.trim(),
        category: category.trim(),
        passScorePercent: Number(passScorePercent) || 70,
      });

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const task = await KnowledgeAPI.createTestTask({
          name: q.text.trim(),
          answerVariants: q.options.map((o) => o.trim()),
          correctVariant: q.correct,
          points: 1,
        });
        await KnowledgeAPI.assignTaskToTest(test.id, task.id, i);
      }

      toast.success("Тест создан");
      setTitle("");
      setCategory("");
      setPassScorePercent("70");
      setQuestions([{ id: 1, text: "", options: ["", ""], correct: 0 }]);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось создать тест");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Создание теста" showBack white />

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Basic info card */}
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <label style={{ color: "#374151", fontSize: 13, fontWeight: 600, display: "block" }}>Название теста</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название теста"
            className="w-full h-11 px-4 rounded-xl border"
            style={{ border: "1.5px solid #E2E8F0", fontSize: 14, color: "#1E293B", outline: "none" }}
          />
          <label style={{ color: "#374151", fontSize: 13, fontWeight: 600, display: "block" }}>Категория</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Например: Базовый, Итоговый"
            className="w-full h-11 px-4 rounded-xl border"
            style={{ border: "1.5px solid #E2E8F0", fontSize: 14, color: "#1E293B", outline: "none" }}
          />
        </div>

        {/* Test parameters card */}
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>Параметры теста</h3>

          <div className="flex items-center gap-3">
            <CheckCircle size={16} color="#2E7D32" />
            <div className="flex-1">
              <label style={{ color: "#374151", fontSize: 12, fontWeight: 500 }}>Проходной балл (%)</label>
              <input
                type="number"
                value={passScorePercent}
                onChange={(e) => setPassScorePercent(e.target.value)}
                min={1}
                max={100}
                className="w-full h-9 px-3 rounded-lg border mt-1"
                style={{ border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", outline: "none" }}
              />
            </div>
          </div>

        </div>

        {questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Вопрос {qIdx + 1}</h3>
              <button onClick={() => removeQuestion(q.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                <Trash2 size={16} color="#EF4444" />
              </button>
            </div>
            <input type="text" value={q.text} onChange={(e) => updateQuestion(q.id, "text", e.target.value)} placeholder="Текст вопроса" className="w-full h-10 px-4 rounded-lg border mb-3" style={{ border: "1.5px solid #E2E8F0", fontSize: 14, color: "#1E293B", outline: "none" }} />
            <p style={{ color: "#64748B", fontSize: 12, marginBottom: 8 }}>Варианты ответов (выберите правильный):</p>
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className="flex items-center gap-2 mb-2">
                <input type="radio" name={`correct-${q.id}`} checked={q.correct === oIdx} onChange={() => updateQuestion(q.id, "correct", oIdx)} className="w-4 h-4" style={{ accentColor: "#2E7D32" }} />
                <input type="text" value={opt} onChange={(e) => updateOption(q.id, oIdx, e.target.value)} placeholder={`Вариант ${oIdx + 1}`} className="flex-1 h-9 px-3 rounded-lg border" style={{ border: "1.5px solid #E2E8F0", fontSize: 13, color: "#1E293B", outline: "none" }} />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(q.id, oIdx)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addOption(q.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg mt-1" style={{ color: "#C41E3A", fontSize: 13, fontWeight: 500 }}>
              <Plus size={14} />
              Добавить вариант
            </button>
          </div>
        ))}

        <button onClick={addQuestion} className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2" style={{ border: "2px dashed #C41E3A", color: "#C41E3A", fontSize: 14, fontWeight: 600, background: "transparent" }}>
          <Plus size={18} />
          Добавить вопрос
        </button>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full h-12 rounded-[10px] flex items-center justify-center"
          style={{ background: saving ? "#94A3B8" : "#C41E3A", color: "#fff", fontSize: 15, fontWeight: 600, marginTop: 8 }}
        >
          {saving ? "Сохранение..." : "Создать тест"}
        </button>
      </div>
    </div>
  );
}
