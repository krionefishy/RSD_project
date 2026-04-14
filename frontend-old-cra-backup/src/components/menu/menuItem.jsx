import React from "react";
import { NavLink } from "react-router";
import cn from "classnames";
import styles from "./menu.module.css";

export const MenuItem = ({ path, icon, text, exact = false }) => {
  return (
    <li className={styles.item}>
      <NavLink
        to={path}
        end={exact}
        className={({ isActive }) =>
          cn(styles.link, isActive && styles.active)
        }
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.text}>{text}</span>
      </NavLink>
    </li>
  );
};
