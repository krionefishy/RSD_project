import { Outlet, useLocation } from "react-router";
import { Menu } from "../components/menu/menu";
import { MenuItem } from "../components/menu/menuItem";
import { KnowledgeBaseIcon, ProfileIcon, SalesIcon } from "../assets/icons";
import styles from "./templates.module.css";

export const UserTemplate = () => {
  const location = useLocation();

  // Don't show menu on material and test pages for better focus
  const hideMenuPaths = ["/knowledge/material/", "/knowledge/test/"];
  const shouldShowMenu = !hideMenuPaths.some((path) =>
    location.pathname.includes(path)
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <Outlet />
      </div>
      {shouldShowMenu && (
        <Menu>
          <MenuItem
            path="/knowledge"
            icon={<KnowledgeBaseIcon />}
            text="База знаний"
          />
          <MenuItem path="/sales" icon={<SalesIcon />} text="Продажи" />
          <MenuItem path="/profile" icon={<ProfileIcon />} text="Профиль" />
        </Menu>
      )}
    </div>
  );
};
