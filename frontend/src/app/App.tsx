import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useSetAtom } from "jotai";
import { router } from "./routes";
import { Toaster } from "../components/ui/sonner";
import { AppProvider } from "../context/AppContext";
import { MobileShell } from "../components/MobileShell";
import { apiClient } from "../api/APIClient";
import { AuthAPI } from "../api/AuthAPI";
import { authStatusAtom, userAtom } from "../store/atoms";
import { authStorage } from "../utils/authStorage";

function AuthBootstrap() {
  const setUser = useSetAtom(userAtom);
  const setStatus = useSetAtom(authStatusAtom);

  useEffect(() => {
    document.documentElement.setAttribute("data-build", "2026-06-23-prod-1");
    apiClient.setRefreshHandler(async () => AuthAPI.refresh());
    apiClient.setUnauthorizedHandler(() => {
      authStorage.clear();
      setUser(null);
      setStatus("unauthenticated");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    });
    return () => {
      apiClient.setRefreshHandler(null);
      apiClient.setUnauthorizedHandler(null);
    };
  }, [setStatus, setUser]);

  return null;
}

function App() {
  return (
    <AppProvider>
      <AuthBootstrap />
      <MobileShell>
        <RouterProvider router={router} />
      </MobileShell>
      <Toaster />
    </AppProvider>
  );
}

export default App;
