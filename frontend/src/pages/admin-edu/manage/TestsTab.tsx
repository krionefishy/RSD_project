import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeAPI } from "../../../api/KnowledgeAPI";
import type { CourseListItem, CourseTestTaskBankItem, Test, TestTaskAdmin } from "../../../types/knowledge";
import { getErrorMessage } from "../../../utils/errors";
import { ConfirmDialog } from "./ConfirmDialog";

export function TestsTab() {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Record<number, TestTaskAdmin[]>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [taskBank, setTaskBank] = useState<CourseTestTaskBankItem[]>([]);
  const [taskBankLoading, setTaskBankLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [testForm, setTestForm] = useState({
    name: "",
    category: "",
    description: "",
    isFinal: false,
    courseId: 0,
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
      const [testItems, courseItems] = await Promise.all([
        KnowledgeAPI.listTests(),
        KnowledgeAPI.listAdminCourses(),
      ]);
      setTests(testItems);
      setCourses(courseItems);
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить тесты"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!showCreate || !testForm.isFinal || !testForm.courseId) {
      setTaskBank([]);
      setTaskBankLoading(false);
      return;
    }

    let cancelled = false;
    setTaskBankLoading(true);
    KnowledgeAPI.listCourseTestTaskBank(testForm.courseId)
      .then((items) => {
        if (!cancelled) {
          setTaskBank(items);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTaskBank([]);
          toast.error(getErrorMessage(error, "Не удалось загрузить задачи курса"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTaskBankLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showCreate, testForm.isFinal, testForm.courseId]);

  useEffect(() => {
    setSelectedFinalTaskIds(new Set());
  }, [testForm.courseId, testForm.isFinal]);

  const handleCreateTest = async () => {
    if (!testForm.name.trim() || !testForm.category.trim()) {
      toast.error("Заполните название и категорию");
      return;
    }
    if (testForm.isFinal && !testForm.courseId) {
      toast.error("Выберите курс для итогового теста");
      return;
    }
    const selectedTaskIds = taskBank.filter((task) => selectedFinalTaskIds.has(task.taskId)).map((task) => task.taskId);
    if (testForm.isFinal && selectedTaskIds.length === 0) {
      toast.error("Выберите хотя бы одну задачу для итогового теста");
      return;
    }
    try {
      const test = await KnowledgeAPI.createTest({
        name: testForm.name.trim(),
        category: testForm.category.trim(),
        description: testForm.description.trim() || undefined,
        isFinal: testForm.isFinal,
        courseId: testForm.isFinal ? testForm.courseId : undefined,
        passScorePercent: testForm.passScorePercent,
      });
      if (testForm.isFinal) {
        for (let index = 0; index < selectedTaskIds.length; index += 1) {
          await KnowledgeAPI.assignTaskToTest(test.id, selectedTaskIds[index], index);
        }
      }
      toast.success("Тест создан");
      setShowCreate(false);
      setTestForm({ name: "", category: "", description: "", isFinal: false, courseId: 0, passScorePercent: 70 });
      setSelectedFinalTaskIds(new Set());
      setTaskBank([]);
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

  const [selectedFinalTaskIds, setSelectedFinalTaskIds] = useState<Set<number>>(new Set());

  const toggleFinalTask = (taskId: number) => {
    setSelectedFinalTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
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
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setExpandedId(expandedId === test.id ? null : test.id)}
            >
              <p className="break-words pr-2 font-semibold text-slate-800 text-sm">{test.name}</p>
              <p className="text-xs text-slate-400">
                {test.category} · {test.tasksCount} задач · проход {test.passScorePercent}%
              </p>
            </button>
            <button type="button" className="flex-shrink-0" onClick={() => setDeleteId(test.id)}>
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
              <input
                type="number"
                min={1}
                value={taskForm.points}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, points: Math.max(1, Number(e.target.value) || 1) }))
                }
                placeholder="Баллы за вопрос"
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
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 flex max-h-[92vh] flex-col gap-3 overflow-y-auto">
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
            <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={testForm.isFinal}
                onChange={(e) =>
                  {
                    const checked = e.target.checked;
                    setTestForm((prev) => ({
                      ...prev,
                      isFinal: checked,
                      courseId: checked ? prev.courseId : 0,
                    }));
                    if (!checked) {
                      setSelectedFinalTaskIds(new Set());
                    }
                  }
                }
              />
              Итоговый тест
            </label>
            {testForm.isFinal && (
              <>
                <select
                  value={testForm.courseId}
                  onChange={(e) =>
                    setTestForm((prev) => ({ ...prev, courseId: Number(e.target.value) || 0 }))
                  }
                  className="h-10 rounded-lg border px-3 text-sm"
                >
                  <option value={0}>Выберите курс</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>

                <div className="rounded-xl border border-slate-200">
                  <div className="border-b border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                    Банк задач курса
                    <span className="ml-2 text-xs text-slate-400">
                      Выбрано: {selectedFinalTaskIds.size}
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {taskBankLoading ? (
                      <p className="px-2 py-3 text-sm text-slate-500">Загрузка задач...</p>
                    ) : taskBank.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-slate-500">
                        В этом курсе пока нет задач из тестов.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {taskBank.map((item) => (
                          <label
                            key={item.taskId}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedFinalTaskIds.has(item.taskId)}
                              onChange={() => toggleFinalTask(item.taskId)}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-medium text-slate-800">{item.taskName}</p>
                              <p className="text-xs text-slate-500">
                                {item.testName} · {item.points} б. · {item.answerVariantsCount} вариантов
                              </p>
                              {item.taskDescription && (
                                <p className="mt-1 break-words text-xs text-slate-400">{item.taskDescription}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
              <button
                onClick={() => {
                  setShowCreate(false);
                  setSelectedFinalTaskIds(new Set());
                  setTaskBank([]);
                  setTestForm({ name: "", category: "", description: "", isFinal: false, courseId: 0, passScorePercent: 70 });
                }}
                className="flex-1 h-10 rounded-lg bg-slate-100 text-sm"
              >
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
