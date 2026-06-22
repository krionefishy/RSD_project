import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../../api/KnowledgeAPI";
import type { Test, TestTaskAdmin } from "../../../types/knowledge";
import { getErrorMessage } from "../../../utils/errors";
import { ConfirmDialog } from "./ConfirmDialog";

export function TestsTab() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Record<number, TestTaskAdmin[]>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [testForm, setTestForm] = useState({
    name: "",
    category: "",
    description: "",
    passScorePercent: 70,
  });

  const [taskForm, setTaskForm] = useState({
    name: "",
    points: 1,
    answerVariants: ["", ""],
    correctVariant: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTests(await KnowledgeAPI.listTests());
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить тесты"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateTest = async () => {
    if (!testForm.name.trim() || !testForm.category.trim()) {
      toast.error("Заполните название и категорию");
      return;
    }
    try {
      const test = await KnowledgeAPI.createTest({
        name: testForm.name.trim(),
        category: testForm.category.trim(),
        description: testForm.description.trim() || undefined,
        passScorePercent: testForm.passScorePercent,
      });
      toast.success("Тест создан");
      setShowCreate(false);
      setTestForm({ name: "", category: "", description: "", passScorePercent: 70 });
      await load();
      setExpandedId(test.id);
      setTasks((prev) => ({ ...prev, [test.id]: [] }));
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать тест"));
    }
  };

  const handleDeleteTest = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await KnowledgeAPI.deleteTest(deleteId);
      toast.success("Тест удалён");
      setDeleteId(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить тест"));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateTask = async (testId: number) => {
    const variants = taskForm.answerVariants.map((v) => v.trim()).filter(Boolean);
    if (!taskForm.name.trim() || variants.length < 2) {
      toast.error("Укажите вопрос и минимум два варианта ответа");
      return;
    }
    try {
      const task = await KnowledgeAPI.createTestTask({
        name: taskForm.name.trim(),
        points: taskForm.points,
        answerVariants: variants,
        correctVariant: taskForm.correctVariant,
      });
      await KnowledgeAPI.assignTaskToTest(testId, task.id, (tasks[testId]?.length ?? 0));
      setTasks((prev) => ({ ...prev, [testId]: [...(prev[testId] ?? []), task] }));
      setTaskForm({ name: "", points: 1, answerVariants: ["", ""], correctVariant: 0 });
      await load();
      toast.success("Задача добавлена");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать задачу"));
    }
  };

  const handleDeleteTask = async (testId: number, taskId: number) => {
    try {
      await KnowledgeAPI.removeTaskFromTest(testId, taskId);
      await KnowledgeAPI.deleteTestTask(taskId);
      setTasks((prev) => ({
        ...prev,
        [testId]: (prev[testId] ?? []).filter((t) => t.id !== taskId),
      }));
      await load();
      toast.success("Задача удалена");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить задачу"));
    }
  };

  if (loading) {
    return <p className="text-center py-8 text-sm text-slate-500">Загрузка тестов...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2 bg-[#C41E3A] text-white text-sm font-semibold"
      >
        <Plus size={18} />
        Создать тест
      </button>

      {tests.map((test) => (
        <div key={test.id} className="rounded-2xl bg-white shadow-sm p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="text-left flex-1"
              onClick={() => setExpandedId(expandedId === test.id ? null : test.id)}
            >
              <p className="font-semibold text-slate-800 text-sm">{test.name}</p>
              <p className="text-xs text-slate-400">
                {test.category} · {test.tasksCount} задач · проход {test.passScorePercent}%
              </p>
            </button>
            <button type="button" onClick={() => setDeleteId(test.id)}>
              <Trash2 size={16} color="#DC2626" />
            </button>
          </div>

          {expandedId === test.id && (
            <div className="mt-3 border-t border-slate-100 pt-3 flex flex-col gap-2">
              {(tasks[test.id] ?? []).map((task, index) => (
                <div key={task.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-700">
                      {index + 1}. {task.name}
                    </span>
                    <button type="button" onClick={() => void handleDeleteTask(test.id, task.id)}>
                      <Trash2 size={12} color="#DC2626" />
                    </button>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {task.points} б. · верный: {task.answerVariants[task.correctVariant]}
                  </p>
                </div>
              ))}

              <input
                value={taskForm.name}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Текст вопроса"
                className="h-9 px-3 rounded-lg border text-sm"
              />
              {taskForm.answerVariants.map((variant, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={taskForm.correctVariant === index}
                    onChange={() => setTaskForm((prev) => ({ ...prev, correctVariant: index }))}
                  />
                  <input
                    value={variant}
                    onChange={(e) => {
                      const next = [...taskForm.answerVariants];
                      next[index] = e.target.value;
                      setTaskForm((prev) => ({ ...prev, answerVariants: next }));
                    }}
                    placeholder={`Вариант ${index + 1}`}
                    className="flex-1 h-8 px-2 rounded-lg border text-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-[#2E7D32]"
                onClick={() =>
                  setTaskForm((prev) => ({ ...prev, answerVariants: [...prev.answerVariants, ""] }))
                }
              >
                + вариант
              </button>
              <button
                type="button"
                onClick={() => void handleCreateTask(test.id)}
                className="h-9 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold"
              >
                Добавить задачу
              </button>
            </div>
          )}
        </div>
      ))}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-2">
            <h3 className="font-semibold text-slate-800">Новый тест</h3>
            <input
              value={testForm.name}
              onChange={(e) => setTestForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Название"
              className="h-10 px-3 rounded-lg border text-sm"
            />
            <input
              value={testForm.category}
              onChange={(e) => setTestForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Категория"
              className="h-10 px-3 rounded-lg border text-sm"
            />
            <input
              type="number"
              value={testForm.passScorePercent}
              onChange={(e) =>
                setTestForm((prev) => ({ ...prev, passScorePercent: Number(e.target.value) || 0 }))
              }
              placeholder="Проходной % (например 70)"
              className="h-10 px-3 rounded-lg border text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-lg bg-slate-100 text-sm">
                Отмена
              </button>
              <button
                onClick={() => void handleCreateTest()}
                className="flex-1 h-10 rounded-lg bg-[#C41E3A] text-white text-sm"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Удалить тест?"
        description="Тест и все задачи будут удалены."
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void handleDeleteTest()}
      />
    </div>
  );
}
