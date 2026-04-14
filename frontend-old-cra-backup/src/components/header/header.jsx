import React from "react";
import cn from "classnames";
import styles from "./header.module.css";

export const Header = ({ title, subtitle, children, className }) => {
  return (
    <header className={cn(styles.header, className)}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
};
