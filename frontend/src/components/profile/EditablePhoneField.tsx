import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserAPI } from "../../api/UserAPI";
import { toast } from "sonner";
import { getErrorMessage } from "../../utils/errors";
import { validateRuPhone } from "../../utils/phone";

interface EditablePhoneFieldProps {
  variant?: "row" | "card";
}

export function EditablePhoneField({ variant = "row" }: EditablePhoneFieldProps) {
  const { user, setUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const displayPhone = user.phone || "Не указан";

  const startEdit = () => {
    setValue(user.phone ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setValue("");
  };

  const savePhone = async () => {
    const trimmed = value.trim();
    const validationError = trimmed ? validateRuPhone(trimmed) : null;
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const updated = await UserAPI.updateOwnPhone(trimmed || null);
      setUser({ ...user, phone: updated.phone ?? "" });
      setEditing(false);
      toast.success("Телефон обновлён");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось обновить телефон"));
    } finally {
      setSaving(false);
    }
  };

  if (variant === "card") {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="flex-1">
          <p style={{ color: "#64748B", fontSize: 12 }}>Телефон</p>
          {editing ? (
            <input
              type="tel"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-lg border text-sm"
              style={{ borderColor: "#E2E8F0" }}
              placeholder="+7 900 000-00-00"
              autoFocus
            />
          ) : (
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>{displayPhone}</p>
          )}
        </div>
        {editing ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => void savePhone()}
              disabled={saving}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#E8F5E9" }}
              aria-label="Сохранить"
            >
              <Check size={16} color="#2E7D32" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#F1F5F9" }}
              aria-label="Отмена"
            >
              <X size={16} color="#64748B" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#F1F5F9" }}
            aria-label="Изменить телефон"
          >
            <Pencil size={16} color="#64748B" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ color: "#64748B", fontSize: 13 }}>Телефон</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 px-2 rounded-lg border text-sm w-[160px]"
            style={{ borderColor: "#E2E8F0" }}
            placeholder="+7 900 000-00-00"
            autoFocus
          />
          <button type="button" onClick={() => void savePhone()} disabled={saving} aria-label="Сохранить">
            <Check size={16} color="#2E7D32" />
          </button>
          <button type="button" onClick={cancelEdit} disabled={saving} aria-label="Отмена">
            <X size={16} color="#64748B" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={startEdit} className="flex items-center gap-1.5">
          <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{displayPhone}</span>
          <Pencil size={14} color="#94A3B8" />
        </button>
      )}
    </div>
  );
}
