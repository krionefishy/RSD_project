import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "../../../components/header/header";
import { ProgressBar } from "../../../components/progressBar/progressBar";
import { Loader } from "../../../components/loader/loader";
import { CheckIcon } from "../../../assets/icons";
import KnowledgeAPI from "../../../api/KnowledgeAPI";
import styles from "./knowledgeBasePage.module.css";

export const KnowledgeBasePage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await KnowledgeAPI.fetchCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const getCourseProgress = (course) => {
    const progress = course.progress;
    if (!progress) return 0;

    const totalItems = 5; // Mock: 3 materials + 2 tests per course
    const completedItems =
      (progress.materials_completed?.length || 0) +
      (progress.tests_completed?.length || 0);
    return Math.round((completedItems / totalItems) * 100);
  };

  const getCourseStatus = (course) => {
    const progress = course.progress;
    if (!progress) return "not_started";
    if (progress.is_course_completed_successfully) return "completed";
    if (progress.is_course_completed) return "failed";
    if (getCourseProgress(course) > 0) return "in_progress";
    return "not_started";
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header title="База знаний" />
        <div className={styles.loaderContainer}>
          <Loader size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header title="База знаний" subtitle="Доступные курсы обучения" />

      <div className={styles.content}>
        {courses.length === 0 ? (
          <p className={styles.empty}>Пока нет доступных курсов</p>
        ) : (
          <div className={styles.coursesList}>
            {courses.map((course) => {
              const progress = getCourseProgress(course);
              const status = getCourseStatus(course);

              return (
                <div
                  key={course.id}
                  className={styles.courseCard}
                  onClick={() => navigate(`/knowledge/course/${course.id}`)}
                >
                  <div className={styles.courseHeader}>
                    <h3 className={styles.courseName}>{course.name}</h3>
                    {status === "completed" && (
                      <span className={styles.completedBadge}>
                        <CheckIcon />
                      </span>
                    )}
                  </div>

                  <p className={styles.courseDescription}>
                    {course.description}
                  </p>

                  <div className={styles.courseMeta}>
                    <span className={styles.points}>
                      {course.rating_points} баллов
                    </span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.mrp}>проходной: {course.mrp}%</span>
                  </div>

                  <div className={styles.progressSection}>
                    <ProgressBar
                      progress={progress}
                      showLabel={true}
                      size="small"
                    />
                    <span
                      className={`${styles.status} ${styles[status]}`}
                    >
                      {status === "not_started" && "Не начат"}
                      {status === "in_progress" && "В процессе"}
                      {status === "completed" && "Пройден"}
                      {status === "failed" && "Не пройден"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
