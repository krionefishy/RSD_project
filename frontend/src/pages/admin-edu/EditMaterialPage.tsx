// React import not needed in React 18+
import { useParams } from "react-router";
import { AppHeader } from "../../components/AppHeader";

export default function EditMaterialPage() {
  const { materialId } = useParams<{ materialId: string }>();

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Редактирование материала" showBack white />
      <div className="px-4 py-8 text-center">
        <p style={{ color: "#64748B", fontSize: 14 }}>Редактирование материала ID: {materialId}</p>
        <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 8 }}>Форма редактирования контента</p>
      </div>
    </div>
  );
}
