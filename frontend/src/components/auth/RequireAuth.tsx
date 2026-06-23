import { useEffect } from "react";
import { Navigate } from "react-router";
import { useAtom } from "jotai";
import { UserAPI } from "../../api/UserAPI";
import { useApp } from "../../context/AppContext";
import { authStatusAtom } from "../../store/atoms";
import { PageLoader } from "../PageLoader";
import { authStorage } from "../../utils/authStorage";
import { roleRoutes } from "../../utils/roleMap";
import { UserRole } from "../../types/user";

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { user, setUser } = useApp();
  const [status, setStatus] = useAtom(authStatusAtom);

  useEffect(() => {
    if (user) return;
    if (status === "loading") return;
    if (!authStorage.hasTokens()) {
      if (status !== "unauthenticated") setStatus("unauthenticated");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    setStatus("loading");
    UserAPI.fetchMe(controller.signal)
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (cancelled) return;
        authStorage.clear();
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [user, status, setStatus, setUser]);

  if (status === "loading" || (status === "idle" && authStorage.hasTokens())) {
    return <PageLoader fullScreen message="Загрузка профиля..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleRoutes[user.role] ?? "/login"} replace />;
  }

  return <>{children}</>;
}
