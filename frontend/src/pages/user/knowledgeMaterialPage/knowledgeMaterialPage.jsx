import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Header } from "../../../components/header/header";
import { Button } from "../../../components/button/button";
import { Loader } from "../../../components/loader/loader";
import { ArrowLeftIcon, CheckIcon } from "../../../assets/icons";
import KnowledgeAPI from "../../../api/KnowledgeAPI";
import styles from "./knowledgeMaterialPage.module.css";

export const KnowledgeMaterialPage = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const loadMaterial = async () => {
      try {
        const data = await KnowledgeAPI.fetchMaterial(parseInt(materialId));
        setMaterial(data);
        setCompleted(data.is_completed);
      } catch (error) {
        console.error("Failed to load material:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [materialId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await KnowledgeAPI.completeMaterial(parseInt(materialId));
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Header title="Материал" />
        <div className={styles.loaderContainer}>
          <Loader size="large" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className={styles.container}>
        <Header title="Ошибка" />
        <div className={styles.content}>
          <p>Материал не найден</p>
          <Button onClick={() => navigate(-1)}>Назад</Button>
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

      <Header title={material.name} />

      <div className={styles.content}>
        <div className={styles.card}>
          {material.description && (
            <p className={styles.description}>{material.description}</p>
          )}

          <div
            className={styles.text}
            dangerouslySetInnerHTML={{ __html: material.text }}
          />

          {/* Attachments placeholder */}
          <div className={styles.attachments}>
            <h4>Вложения</h4>
            <p className={styles.attachmentsPlaceholder}>
              Вложения недоступны в демо-режиме
            </p>
          </div>
        </div>

        {/* Complete button */}
        <div className={styles.actionSection}>
          {completed ? (
            <div className={styles.completedMessage}>
              <CheckIcon />
              <span>Материал изучен</span>
            </div>
          ) : (
            <Button
              fullWidth
              size="large"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? <Loader size="small" /> : "Отметить как изученное"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
