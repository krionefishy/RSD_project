import React from "react";
import cn from "classnames";
import styles from "./progressBar.module.css";

export const ProgressBar = ({ progress, max = 100, showLabel = true, size = "medium", className }) => {
  const percentage = Math.min(100, Math.max(0, (progress / max) * 100));

  return (
    <div className={cn(styles.container, styles[size], className)}>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
};
