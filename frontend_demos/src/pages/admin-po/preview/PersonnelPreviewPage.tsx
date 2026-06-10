import { ModulePreviewLayout } from "../../../components/layout/ModulePreviewLayout";
import ManageUsersPage from "../../admin-personnel/ManageUsersPage";

export default function AdminPOPersonnelPreviewPage() {
  return (
    <ModulePreviewLayout title="Персонал">
      <ManageUsersPage />
    </ModulePreviewLayout>
  );
}
