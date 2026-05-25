import { Navigate } from "react-router";

/** Legacy nav target — assignments live on ManagePage. */
export default function AdminEduAssignmentsPage() {
  return <Navigate to="/admin-edu/manage?tab=assignments" replace />;
}
