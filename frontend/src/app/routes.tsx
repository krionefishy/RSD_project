import { createBrowserRouter, Navigate } from "react-router";
import { RequireAuth } from "../components/auth/RequireAuth";

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
import AdminSalesManagePage from "../pages/admin-sales/ManagePage";
import AdminSalesReportsPage from "../pages/admin-sales/ReportsPage";
import AdminSalesProfilePage from "../pages/admin-sales/ProfilePage";

// Pages - Admin Personnel
import AdminPersonnelDashboardPage from "../pages/admin-personnel/DashboardPage";
import ManageUsersPage from "../pages/admin-personnel/ManageUsersPage";
import CreateEmployeePage from "../pages/admin-personnel/CreateEmployeePage";
import AdminEmployeeDetailPage from "../pages/admin-personnel/EmployeeDetailPage";
import AdminPersonnelProfilePage from "../pages/admin-personnel/ProfilePage";
import TimesheetsPage from "../pages/admin-personnel/TimesheetsPage";

// Pages - Admin PO
import AdminPODashboardPage from "../pages/admin-po/DashboardPage";
import AccountsPage from "../pages/admin-po/AccountsPage";
import AdminPOPersonnelPreviewPage from "../pages/admin-po/preview/PersonnelPreviewPage";
import AdminPOEduPreviewPage from "../pages/admin-po/preview/EduPreviewPage";
import AdminPOEduAssignmentsPreviewPage from "../pages/admin-po/preview/EduAssignmentsPreviewPage";
import AdminPOCourseEnrollmentsPreviewPage from "../pages/admin-po/preview/CourseEnrollmentsPreviewPage";
import AdminPOSalesPreviewPage from "../pages/admin-po/preview/SalesPreviewPage";

// Pages - SuperAdmin
import SuperAdminDashboardPage from "../pages/superadmin/DashboardPage";
import SuperAdminProfilePage from "../pages/superadmin/ProfilePage";
import BlocksListPage from "../pages/admin-personnel/BlocksListPage";
import BlockDetailPage from "../pages/admin-personnel/BlockDetailPage";
import LocationsListPage from "../pages/admin-personnel/LocationsListPage";
import LocationDetailPage from "../pages/admin-personnel/LocationDetailPage";

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
      <RequireAuth allowedRoles={["admin-edu", "admin-po", "superadmin"]}>
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
      <RequireAuth allowedRoles={["admin-sales", "admin-po", "superadmin"]}>
        <AdminSalesTemplate />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <AdminSalesDashboardPage /> },
      { path: "manage", element: <AdminSalesManagePage /> },
      { path: "reports", element: <AdminSalesReportsPage /> },
      { path: "profile", element: <AdminSalesProfilePage /> },
    ],
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
      { path: "accounts", element: <AccountsPage /> },
      { path: "preview/personnel", element: <AdminPOPersonnelPreviewPage /> },
      { path: "preview/personnel/create", element: <CreateEmployeePage /> },
      { path: "preview/personnel/:userId", element: <AdminEmployeeDetailPage /> },
      { path: "preview/edu", element: <AdminPOEduPreviewPage /> },
      { path: "preview/edu/assignments", element: <AdminPOEduAssignmentsPreviewPage /> },
      { path: "preview/edu/manage/:courseId", element: <AdminPOCourseEnrollmentsPreviewPage /> },
      { path: "preview/edu/edit-material/:materialId", element: <EditMaterialPage /> },
      { path: "preview/sales", element: <AdminPOSalesPreviewPage /> },
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
      { path: "accounts", element: <AccountsPage /> },
      { path: "structure", element: <BlocksListPage /> },
      { path: "structure/blocks/:blockId", element: <BlockDetailPage /> },
      { path: "structure/locations", element: <LocationsListPage /> },
      { path: "structure/locations/:locationId", element: <LocationDetailPage /> },
      { path: "profile", element: <SuperAdminProfilePage /> },
    ],
  },

  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
