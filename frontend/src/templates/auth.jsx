import { Outlet } from "react-router";
import styles from "./templates.module.css";

export const AuthTemplate = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <Outlet />
      </div>
    </div>
  );
};
