import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserInfo, fetchUserStatus } from "../../features/user/slice";
import { isAuthenticated, clearAuthSession } from "../../utils/authStorage";
import { PageLoader } from "../../components/loader/loader";
import styles from "./app.module.css";

export const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const userLoaded = useSelector((state) => state.user.loaded);
  const userError = useSelector((state) => state.user.error);

  useEffect(() => {
    const initAuth = async () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        // If not authenticated and not on auth page, redirect to login
        if (!location.pathname.startsWith("/auth")) {
          navigate("/auth/login", { replace: true });
        }
        setLoading(false);
        return;
      }

      // If authenticated, fetch user data
      try {
        await dispatch(fetchUserStatus()).unwrap();
        await dispatch(fetchUserInfo()).unwrap();
      } catch (error) {
        console.error("Auth initialization error:", error);
        // If error fetching user data, clear auth and redirect
        clearAuthSession();
        if (!location.pathname.startsWith("/auth")) {
          navigate("/auth/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [dispatch, navigate, location.pathname]);

  // If authenticated and on auth page, redirect to home
  useEffect(() => {
    if (userLoaded && isAuthenticated() && location.pathname.startsWith("/auth")) {
      navigate("/", { replace: true });
    }
  }, [userLoaded, location.pathname, navigate]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className={styles.app}>
      <Outlet />
    </div>
  );
};
