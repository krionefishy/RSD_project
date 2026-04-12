import { App } from "../pages/app/app";
import { AuthTemplate } from "../templates/auth";
import { UserTemplate } from "../templates/user";

// Auth pages
import { LoginPage } from "../pages/auth/login/loginPage";

// User pages
import { KnowledgeBasePage } from "../pages/user/knowledgeBasePage/knowledgeBasePage";
import { KnowledgeCoursePage } from "../pages/user/knowledgeCoursePage/knowledgeCoursePage";
import { KnowledgeMaterialPage } from "../pages/user/knowledgeMaterialPage/knowledgeMaterialPage";
import { KnowledgeTestPage } from "../pages/user/knowledgeTestPage/knowledgeTestPage";
import { ProfilePage } from "../pages/user/profilePage/profilePage";
import { SalesPage } from "../pages/user/salesPage/salesPage";

export const routerConfig = [
  {
    path: "/",
    element: <App />,
    children: [
      // Auth routes (no authentication required)
      {
        element: <AuthTemplate />,
        children: [
          {
            path: "auth/login",
            element: <LoginPage />,
          },
        ],
      },
      // User routes (authentication required)
      {
        element: <UserTemplate />,
        children: [
          {
            index: true,
            element: <KnowledgeBasePage />,
          },
          {
            path: "knowledge",
            element: <KnowledgeBasePage />,
          },
          {
            path: "knowledge/course/:courseId",
            element: <KnowledgeCoursePage />,
          },
          {
            path: "knowledge/material/:materialId",
            element: <KnowledgeMaterialPage />,
          },
          {
            path: "knowledge/test/:testId",
            element: <KnowledgeTestPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "sales",
            element: <SalesPage />,
          },
        ],
      },
      // Catch-all redirect
      {
        path: "*",
        element: <div>404 - Страница не найдена</div>,
      },
    ],
  },
];
