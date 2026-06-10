import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { AppSelect } from "../../components/AppSelect";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import type { BlockMemberStatus } from "../../types/profile";
import { getErrorMessage } from "../../utils/errors";
import { toast } from "sonner";
import { useStructureOptions } from "../../hooks/useStructureOptions";

const inputStyle = {
  borderColor: "#E2E8F0",
  fontSize: 14,
} as const;

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { blocks: structureBlocks, locations: structureLocations } = useStructureOptions();
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    externalSystemId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    position: "",
    locationId: "",
    blockId: "",
    blockMemberStatus: "primary" as BlockMemberStatus,
  });

  const locationOptions = form.blockId
    ? structureLocations.filter((location) => location.blockId === form.blockId)
    : structureLocations;

  const handleSubmit = async () => {
    if (!form.externalSystemId.trim()) {
      toast.error("Укажите ID в учётной системе");
      return;
    }

    setSaving(true);
    try {
      const result = await AdminStaffAPI.createEmployeeProfile({
        externalSystemId: form.externalSystemId.trim(),
        firstName: form.firstName || undefined,
        middleName: form.middleName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        position: form.position || undefined,
        locationId: form.locationId ? Number(form.locationId) : undefined,
        blockId: form.blockId ? Number(form.blockId) : undefined,
        blockMemberStatus: form.blockMemberStatus,
      });
      setTempPassword(result.temporaryPassword);
      setCreatedUserId(result.user.id);
      toast.success("Сотрудник создан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать сотрудника"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate("/admin-personnel/manage")}
          className="flex items-center gap-1 mb-4"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Назад
        </button>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>Новый сотрудник</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {[
          { key: "externalSystemId", label: "ID в учётной системе *", placeholder: "external_system_id" },
          { key: "lastName", label: "Фамилия", placeholder: "Иванов" },
          { key: "firstName", label: "Имя", placeholder: "Иван" },
          { key: "middleName", label: "Отчество", placeholder: "Иванович" },
          { key: "phone", label: "Телефон", placeholder: "+7..." },
          { key: "birthDate", label: "Дата рождения", placeholder: "", type: "date" },
          { key: "position", label: "Должность", placeholder: "Продавец" },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-1">
            <span style={{ color: "#64748B", fontSize: 12 }}>{field.label}</span>
            <input
              type={field.type ?? "text"}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full h-10 px-3 rounded-lg border"
              style={inputStyle}
            />
          </label>
        ))}

        <label className="flex flex-col gap-1">
          <span style={{ color: "#64748B", fontSize: 12 }}>Блок</span>
          <AppSelect
            value={form.blockId}
            onValueChange={(v) => setForm({ ...form, blockId: v, locationId: "" })}
            emptyOption={{ value: "__none_block__", label: "Не назначен" }}
            options={structureBlocks.map((block) => ({ value: block.id, label: block.name }))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ color: "#64748B", fontSize: 12 }}>Точка</span>
          <AppSelect
            value={form.locationId}
            onValueChange={(v) => setForm({ ...form, locationId: v })}
            emptyOption={{ value: "__none_location__", label: "Не назначена" }}
            options={locationOptions.map((location) => ({ value: location.id, label: location.name }))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span style={{ color: "#64748B", fontSize: 12 }}>Статус в блоке</span>
          <AppSelect
            value={form.blockMemberStatus}
            onValueChange={(v) => setForm({ ...form, blockMemberStatus: v as BlockMemberStatus })}
            options={[
              { value: "primary", label: "Основа" },
              { value: "reserve", label: "Резерв" },
            ]}
          />
        </label>

        {tempPassword && (
          <div className="p-3 rounded-xl" style={{ background: "#F0FDF4" }}>
            <p style={{ color: "#166534", fontSize: 12, marginBottom: 4 }}>Пароль:</p>
            <p style={{ color: "#166534", fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
              {tempPassword}
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || Boolean(tempPassword)}
          className="w-full h-11 rounded-xl mt-2"
          style={{
            background: saving || tempPassword ? "#94A3B8" : "#2E7D32",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {saving ? "Создание..." : "Создать сотрудника"}
        </button>

        {createdUserId && (
          <button
            onClick={() => navigate(`/admin-personnel/manage/${createdUserId}`)}
            className="w-full h-11 rounded-xl"
            style={{ background: "#F1F5F9", color: "#1E293B", fontSize: 14, fontWeight: 500 }}
          >
            Открыть профиль
          </button>
        )}
      </div>
    </div>
  );
}
