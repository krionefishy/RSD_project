import { ReactNode, useCallback } from "react";
import { useAtom } from "jotai";
import { authStatusAtom, userAtom } from "../store/atoms";
import { AppUser } from "../types/user";
import { authStorage } from "../utils/authStorage";

export function AppProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useApp() {
  const [user, setUser] = useAtom(userAtom);
  const [status, setStatus] = useAtom(authStatusAtom);

  const logout = useCallback(() => {
    authStorage.clear();
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
