import { ReactNode, useCallback } from "react";
import { useAtom } from "jotai";
import { authStatusAtom, userAtom } from "../store/atoms";
import { AppUser } from "../types/user";
import { isPresentationMode } from "../config/presentationMode";
import { clearPresentationRole } from "../mock/presentationRoleStorage";
import { authStorage } from "../utils/authStorage";
import { AuthAPI } from "../api/AuthAPI";

export function AppProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useApp() {
  const [user, setUser] = useAtom(userAtom);
  const [status, setStatus] = useAtom(authStatusAtom);

  const logout = useCallback(() => {
    // Best-effort server-side token invalidation; local logout proceeds regardless
    AuthAPI.logout().catch(() => {});
    authStorage.clear();
    if (isPresentationMode()) {
      clearPresentationRole();
    }
    setUser(null);
    setStatus("unauthenticated");
  }, [setUser, setStatus]);

  const setAppUser = useCallback(
    (next: AppUser | null) => {
      setUser(next);
      setStatus(next ? "ready" : "unauthenticated");
    },
    [setUser, setStatus],
  );

  return { user, status, setUser: setAppUser, logout };
}
