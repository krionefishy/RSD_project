import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Header } from "../../../components/header/header";
import { Button } from "../../../components/button/button";
import { ProgressBar } from "../../../components/progressBar/progressBar";
import { Loader } from "../../../components/loader/loader";
import { ArrowLeftIcon } from "../../../assets/icons";
import KnowledgeAPI from "../../../api/KnowledgeAPI";
import styles from "./knowledgeTestPage.module.css";

export const KnowledgeTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Test state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const loadTest = async () => {
      try {
        const [testData, tasksData] = await Promise.all([
          KnowledgeAPI.fetchTest(parseInt(testId)),
          KnowledgeAPI.fetchTestTasks(parseInt(testId)),
        ]);
        setTest(testData);
        setTasks(tasksData);

        // If test already completed, show results
        if (testData.is_completed) {
          setCompleted(true);
          setTestResult({
            is_successful: testData.is_successful,
            score: testData.score,
            max_score: testData.max_score,
          });
        }
      } catch (error) {
        console.error("Failed to load test:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  const currentTask = tasks[currentTaskIndex];
  const progress = tasks.length > 0 ? ((currentTaskIndex) / tasks.length) * 100 : 0;

  const handleSelectAnswer = (answerId) => {
    if (answered) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentTask) return;

    const correct = currentTask.correct_variant === selectedAnswer;
    setIsCorrect(correct);
    setAnswered(true);

    if (correct) {
      setScore((prev) => prev + currentTask.points);
    }
  };

  const handleNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setIsCorrect(null);
    } else {
      // Complete test
      finishTest();
    }
  };

  const finishTest = async () => {
    try {
      const result = await KnowledgeAPI.completeTest(parseInt(testId), score);
      setCompleted(true);
      setTestResult(result);
    } catch (error) {
      console.error("Failed to complete test:", error);
    }
  };

  const handleRetry = () => {
    setCurrentTaskIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setIsCorrect(null);
    setScore(0);
    setCompleted(false);
    setTestResult(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header title="Тест" />
        <div className={styles.loaderContainer}>
          <Loader size="large" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className={styles.container}>
        <Header title="Ошибка" />
        <div className={styles.content}>
          <p>Тест не найден</p>
          <Button onClick={() => navigate(-1)}>Назад</Button>
        </div>
      </div>
    );
  }

  // Show results if test is completed
  if (completed && testResult) {
    return (
      <div className={styles.container}>
        <div className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeftIcon />
          <span>Назад</span>
        </div>

        <Header title={test.name} subtitle="Результаты" />

        <div className={styles.content}>
          <div className={styles.resultCard}>
            <div
              className={`${styles.resultIcon} ${
                testResult.is_successful ? styles.success : styles.failed
              }`}
            >
              {testResult.is_successful ? "✓" : "✗"}
            </div>

            <h3 className={styles.resultTitle}>
              {testResult.is_successful ? "Тест пройден!" : "Тест не пройден"}
            </h3>

            <p className={styles.resultScore}>
              Набрано {score} из {testResult.max_score} баллов
            </p>

            <div className={styles.resultActions}>
              <Button fullWidth onClick={() => navigate(-1)}>
                Вернуться к курсу
              </Button>
              {!testResult.is_successful && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleRetry}
                >
                  Попробовать снова
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton} onClick={() => navigate(-1)}>
        <ArrowLeftIcon />
        <span>Назад</span>
      </div>

      <Header
        title={test.name}
        subtitle={`Вопрос ${currentTaskIndex + 1} из ${tasks.length}`}
      />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressSection}>
          <ProgressBar progress={progress} showLabel={false} />
        </div>

        {/* Current Task */}
        {currentTask && (
          <div className={styles.taskCard}>
            <h3 className={styles.taskName}>{currentTask.name}</h3>
            {currentTask.description && (
              <p className={styles.taskDescription}>{currentTask.description}</p>
            )}

            <div className={styles.answersList}>
              {currentTask.answer_variants.map((variant) => (
                <button
                  key={variant.id}
                  className={`${styles.answerButton} ${
                    selectedAnswer === variant.id ? styles.selected : ""
                  } ${
                    answered && variant.id === currentTask.correct_variant
                      ? styles.correct
                      : ""
                  } ${
                    answered &&
                    selectedAnswer === variant.id &&
                    variant.id !== currentTask.correct_variant
                      ? styles.incorrect
                      : ""
                  }`}
                  onClick={() => handleSelectAnswer(variant.id)}
                  disabled={answered}
                >
                  {variant.text}
                </button>
              ))}
            </div>

            {answered && (
              <div
                className={`${styles.feedback} ${
                  isCorrect ? styles.correctFeedback : styles.incorrectFeedback
                }`}
              >
                {isCorrect
                  ? "Правильно!"
                  : `Неправильно. Правильный ответ: ${
                      currentTask.answer_variants.find(
                        (v) => v.id === currentTask.correct_variant
                      )?.text
                    }`}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actionSection}>
          {!answered ? (
            <Button
              fullWidth
              size="large"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              Ответить
            </Button>
          ) : (
            <Button fullWidth size="large" onClick={handleNextTask}>
              {currentTaskIndex < tasks.length - 1 ? "Следующий вопрос" : "Завершить тест"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
