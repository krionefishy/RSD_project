import React from "react";
import cn from "classnames";
import styles from "./menu.module.css";

export const Menu = ({ children, className }) => {
  return (
    <nav className={cn(styles.menu, className)}>
      <ul className={styles.list}>{children}</ul>
    </nav>
  );
};
