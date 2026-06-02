import { AppHeader } from "../../components/AppHeader";
import { AssignmentsTab } from "./manage/AssignmentsTab";

export default function AdminEduAssignmentsPage() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Назначения" showBack backTo="/admin-edu" white />
      <div className="px-4 py-4">
        <AssignmentsTab enrollmentsBasePath="/admin-edu/manage" />
      </div>
    </div>
  );
}
