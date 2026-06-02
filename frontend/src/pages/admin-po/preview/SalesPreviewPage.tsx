import { ModulePreviewLayout } from "../../../components/layout/ModulePreviewLayout";
import AdminSalesManagePage from "../../admin-sales/ManagePage";

export default function AdminPOSalesPreviewPage() {
  return (
    <ModulePreviewLayout title="Продажи">
      <AdminSalesManagePage />
    </ModulePreviewLayout>
  );
}
