import React from "react";
import cn from "classnames";
import styles from "./loader.module.css";

export const Loader = ({ size = "medium", className }) => {
  return (
    <div className={cn(styles.loader, styles[size], className)}>
      <div className={styles.spinner}></div>
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className={styles.pageLoader}>
      <Loader size="large" />
    </div>
  );
};
