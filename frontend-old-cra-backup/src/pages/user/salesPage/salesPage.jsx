import { Header } from "../../../components/header/header";
import { SalesIcon } from "../../../assets/icons";
import styles from "./salesPage.module.css";

export const SalesPage = () => {
  return (
    <div className={styles.container}>
      <Header title="Продажи" />

      <div className={styles.content}>
        <div className={styles.placeholderCard}>
          <div className={styles.icon}>
            <SalesIcon />
          </div>
          <h2 className={styles.title}>Раздел в разработке</h2>
          <p className={styles.text}>
            Модуль учета продаж и KPI скоро будет доступен.
            <br />
            Следите за обновлениями!
          </p>
          <div className={styles.comingSoon}>Coming Soon</div>
        </div>

        <div className={styles.previewCard}>
          <h3 className={styles.previewTitle}>Что будет включено:</h3>
          <ul className={styles.featureList}>
            <li>Учет ежедневных продаж</li>
            <li>Рейтинг сотрудников по продажам</n            <li>История и статистика</li>
            <li>Цели и мотивация</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
