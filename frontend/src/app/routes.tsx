import { useEffect } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { useAtom } from "jotai";
import { UserAPI } from "../api/UserAPI";
import { useApp } from "../context/AppContext";
import { authStatusAtom } from "../store/atoms";
import { PageLoader } from "../components/PageLoader";
import { authStorage } from "../utils/authStorage";
import { roleRoutes } from "../utils/roleMap";
import { UserRole } from "../types/user";

// Templates
import SellerTemplate from "../templates/SellerTemplate";
import ManagerTemplate from "../templates/ManagerTemplate";
import AdminEduTemplate from "../templates/AdminEduTemplate";
import AdminSalesTemplate from "../templates/AdminSalesTemplate";
import AdminPersonnelTemplate from "../templates/AdminPersonnelTemplate";
import AdminPOTemplate from "../templates/AdminPOTemplate";
import SuperAdminTemplate from "../templates/SuperAdminTemplate";

// Pages - Auth
import LoginPage from "../pages/auth/LoginPage";

// Pages - Seller
import SellerDashboardPage from "../pages/seller/DashboardPage";
import KnowledgeBasePage from "../pages/seller/KnowledgeBasePage";
import KnowledgeSectionPage from "../pages/seller/KnowledgeSectionPage";
import MaterialPage from "../pages/seller/MaterialPage";
import TestListPage from "../pages/seller/TestListPage";
import TestQuestionPage from "../pages/seller/TestQuestionPage";
import TestResultPage from "../pages/seller/TestResultPage";
import SalesPage from "../pages/seller/SalesPage";
import RatingPage from "../pages/seller/RatingPage";
import SchedulePage from "../pages/seller/SchedulePage";
import SellerProfilePage from "../pages/seller/ProfilePage";

// Pages - Manager
import ManagerDashboardPage from "../pages/manager/DashboardPage";
import ManagerReportsPage from "../pages/manager/ReportsPage";
import EmployeesPage from "../pages/manager/EmployeesPage";
import ManagerEmployeeDetailPage from "../pages/manager/EmployeeDetailPage";
import ManagerProfilePage from "../pages/manager/ProfilePage";

// Pages - Admin Edu
import AdminEduDashboardPage from "../pages/admin-edu/DashboardPage";
import AdminEduManagePage from "../pages/admin-edu/ManagePage";
import CourseEnrollmentsPage from "../pages/admin-edu/CourseEnrollmentsPage";
import AdminEduAssignmentsPage from "../pages/admin-edu/AssignmentsPage";
import AdminEduReportsPage from "../pages/admin-edu/ReportsPage";
import EditMaterialPage from "../pages/admin-edu/EditMaterialPage";

// Pages - Admin Sales
import AdminSalesDashboardPage from "../pages/admin-sales/DashboardPage";

// Pages - Admin Personnel
import AdminPersonnelDashboardPage from "../pages/admin-personnel/DashboardPage";
import ManageUsersPage from "../pages/admin-personnel/ManageUsersPage";
import CreateEmployeePage from "../pages/admin-personnel/CreateEmployeePage";
import AdminEmployeeDetailPage from "../pages/admin-personnel/EmployeeDetailPage";
import AdminPersonnelProfilePage from "../pages/admin-personnel/ProfilePage";
import TimesheetsPage from "../pages/admin-personnel/TimesheetsPage";

// Pages - Admin PO
import AdminPODashboardPage from "../pages/admin-po/DashboardPage";

// Pages - SuperAdmin
import SuperAdminDashboardPage from "../pages/superadmin/DashboardPage";
import BlocksListPage from "../pages/admin-personnel/BlocksListPage";
import BlockDetailPage from "../pages/admin-personnel/BlockDetailPage";
import LocationsListPage from "../pages/admin-personnel/LocationsListPage";
import LocationDetailPage from "../pages/admin-personnel/LocationDetailPage";
import SuperAdminSettingsPage from "../pages/superadmin/SettingsPage";

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
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
    setStatus("loading");
    UserAPI.fetchMe()
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
    };
  }, [user, status, setStatus, setUser]);

  if (status === "loading") {
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

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    path: "/seller",
    element: (
      <RequireAuth allowedRoles={["seller"]}>
        <SellerTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <SellerDashboardPage /> },
      { path: "knowledge", element: <KnowledgeBasePage /> },
      { path: "knowledge/:sectionId", element: <KnowledgeSectionPage /> },
      { path: "knowledge/:sectionId/:materialId", element: <MaterialPage /> },
      { path: "tests", element: <TestListPage /> },
      { path: "tests/:testId", element: <TestQuestionPage /> },
      { path: "tests/:testId/result", element: <TestResultPage /> },
      { path: "sales", element: <SalesPage /> },
      { path: "rating", element: <RatingPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "profile", element: <SellerProfilePage /> },
    ],
  },

  {
    path: "/manager",
    element: (
      <RequireAuth allowedRoles={["manager"]}>
        <ManagerTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ManagerDashboardPage /> },
      { path: "reports", element: <ManagerReportsPage /> },
      { path: "employees", element: <EmployeesPage /> },
      { path: "employees/:employeeId", element: <ManagerEmployeeDetailPage /> },
      { path: "locations", element: <LocationsListPage /> },
      { path: "locations/:locationId", element: <LocationDetailPage /> },
      { path: "profile", element: <ManagerProfilePage /> },
    ],
  },

  {
    path: "/admin-edu",
    element: (
      <RequireAuth allowedRoles={["admin-edu"]}>
        <AdminEduTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminEduDashboardPage /> },
      { path: "manage", element: <AdminEduManagePage /> },
      { path: "manage/:courseId", element: <CourseEnrollmentsPage /> },
      { path: "manage/edit-material/:materialId", element: <EditMaterialPage /> },
      { path: "assignments", element: <AdminEduAssignmentsPage /> },
      { path: "reports", element: <AdminEduReportsPage /> },
    ],
  },

  {
    path: "/admin-sales",
    element: (
      <RequireAuth allowedRoles={["admin-sales"]}>
        <AdminSalesTemplate />
      </RequireAuth>
    ),
    children: [{ index: true, element: <AdminSalesDashboardPage /> }],
  },

  {
    path: "/admin-personnel",
    element: (
      <RequireAuth allowedRoles={["admin-personnel", "admin-po", "superadmin"]}>
        <AdminPersonnelTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminPersonnelDashboardPage /> },
      { path: "manage", element: <ManageUsersPage /> },
      { path: "manage/create", element: <CreateEmployeePage /> },
      { path: "manage/:userId", element: <AdminEmployeeDetailPage /> },
      { path: "blocks", element: <BlocksListPage /> },
      { path: "blocks/:blockId", element: <BlockDetailPage /> },
      { path: "locations", element: <LocationsListPage /> },
      { path: "locations/:locationId", element: <LocationDetailPage /> },
      { path: "timesheets", element: <TimesheetsPage /> },
      { path: "profile", element: <AdminPersonnelProfilePage /> },
    ],
  },

  {
    path: "/admin-po",
    element: (
      <RequireAuth allowedRoles={["admin-po"]}>
        <AdminPOTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminPODashboardPage /> },
      { path: "data", element: <AdminPODashboardPage /> },
      { path: "reports", element: <AdminPODashboardPage /> },
      { path: "profile", element: <AdminPODashboardPage /> },
    ],
  },

  {
    path: "/superadmin",
    element: (
      <RequireAuth allowedRoles={["superadmin"]}>
        <SuperAdminTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <SuperAdminDashboardPage /> },
      { path: "structure", element: <BlocksListPage /> },
      { path: "structure/blocks/:blockId", element: <BlockDetailPage /> },
      { path: "structure/locations", element: <LocationsListPage /> },
      { path: "structure/locations/:locationId", element: <LocationDetailPage /> },
      { path: "settings", element: <SuperAdminSettingsPage /> },
      { path: "profile", element: <SuperAdminDashboardPage /> },
    ],
  },

  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
