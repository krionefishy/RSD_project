import { ModulePreviewLayout } from "../../../components/layout/ModulePreviewLayout";
import { AssignmentsTab } from "../../admin-edu/manage/AssignmentsTab";

export default function AdminPOEduAssignmentsPreviewPage() {
  return (
    <ModulePreviewLayout title="Назначения">
      <div className="px-4 py-4">
        <AssignmentsTab enrollmentsBasePath="/admin-po/preview/edu/manage" />
      </div>
    </ModulePreviewLayout>
  );
}
