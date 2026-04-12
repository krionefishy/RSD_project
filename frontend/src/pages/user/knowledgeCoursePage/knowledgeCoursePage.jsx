import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Header } from "../../../components/header/header";
import { Button } from "../../../components/button/button";
import { ProgressBar } from "../../../components/progressBar/progressBar";
import { Loader } from "../../../components/loader/loader";
import { ArrowLeftIcon, CheckIcon } from "../../../assets/icons";
import KnowledgeAPI from "../../../api/KnowledgeAPI";
import styles from "./knowledgeCoursePage.module.css";

export const KnowledgeCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const [courseData, materialsData, testsData] = await Promise.all([
          KnowledgeAPI.fetchCourse(parseInt(courseId)),
          KnowledgeAPI.fetchCourseMaterials(parseInt(courseId)),
          KnowledgeAPI.fetchCourseTests(parseInt(courseId)),
        ]);
        setCourse(courseData);
        setMaterials(materialsData);
        setTests(testsData);
      } catch (error) {
        console.error("Failed to load course:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const getTotalProgress = () => {
    const totalItems = materials.length + tests.length;
    if (totalItems === 0) return 0;

    const completedMaterials = materials.filter((m) => m.is_completed).length;
    const completedTests = tests.filter((t) => t.is_completed).length;
    return Math.round(((completedMaterials + completedTests) / totalItems) * 100);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header title="Курс" />
        <div className={styles.loaderContainer}>
          <Loader size="large" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.container}>
        <Header title="Ошибка" />
        <div className={styles.content}>
          <p>Курс не найден</p>
          <Button onClick={() => navigate("/knowledge")}>
            Вернуться к курсам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backButton} onClick={() => navigate("/knowledge")}>
        <ArrowLeftIcon />
        <span>Назад</span>
      </div>

      <Header title={course.name} />

      <div className={styles.content}>
        {/* Course Info */}
        <div className={styles.infoCard}>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.meta}>
            <span className={styles.points}>{course.rating_points} баллов</span>
            <span className={styles.separator}>•</span>
            <span>Проходной: {course.mrp}%</span>
          </div>
          <div className={styles.progressSection}>
            <span>Общий прогресс</span>
            <ProgressBar progress={getTotalProgress()} showLabel={true} />
          </div>
        </div>

        {/* Materials Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Материалы для изучения</h3>
          {materials.length === 0 ? (
            <p className={styles.empty}>Нет материалов</p>
          ) : (
            <div className={styles.itemsList}>
              {materials.map((material) => (
                <div
                  key={material.material_id}
                  className={styles.itemCard}
                  onClick={() =>
                    navigate(`/knowledge/material/${material.material_id}`)
                  }
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{material.name}</span>
                    <span className={styles.itemCategory}>
                      {material.category}
                    </span>
                  </div>
                  {material.is_completed ? (
                    <span className={styles.completed}>
                      <CheckIcon />
                    </span>
                  ) : (
                    <span className={styles.pending}>Изучить</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tests Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Тестирование</h3>
          {tests.length === 0 ? (
            <p className={styles.empty}>Нет тестов</p>
          ) : (
            <div className={styles.itemsList}>
              {tests.map((test) => (
                <div
                  key={test.test_id}
                  className={`${styles.itemCard} ${
                    test.is_completed ? styles.completedCard : ""
                  }`}
                  onClick={() =>
                    navigate(`/knowledge/test/${test.test_id}`)
                  }
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{test.name}</span>
                    <span className={styles.itemMeta}>
                      {test.is_completed ? (
                        test.is_successful ? (
                          <span className={styles.passed}>
                            Пройден ({test.score}/{test.max_score} баллов)
                          </span>
                        ) : (
                          <span className={styles.failed}>
                            Не пройден ({test.score}/{test.max_score} баллов)
                          </span>
                        )
                      ) : (
                        <span>{test.max_score} баллов</span>
                      )}
                    </span>
                  </div>
                  {!test.is_completed && (
                    <span className={styles.pending}>Пройти</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
