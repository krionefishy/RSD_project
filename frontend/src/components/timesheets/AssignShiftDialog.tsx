import { useEffect, useState } from "react";
import { AppSelect } from "../AppSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { SHIFT_CODE_OPTIONS, formatShiftTimeRange, shiftCodeLabel } from "../../utils/timesheet";
import type { AppUser } from "../../types/user";

export interface ExistingShiftInfo {
  id: number;
  shiftCode: "С1" | "С2";
  startsAt?: string;
  endsAt?: string;
}

export interface AssignShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workDate: string;
  userId?: string;
  employees?: AppUser[];
  existingShift?: ExistingShiftInfo | null;
  submitting?: boolean;
  deleting?: boolean;
  onSubmit: (data: { userId: string; shiftCode: "С1" | "С2" }) => Promise<void>;
  onDelete?: (entryId: number) => Promise<void>;
  onSelectedUserChange?: (userId: string) => void;
}

export function AssignShiftDialog({
  open,
  onOpenChange,
  workDate,
  userId,
  employees,
  existingShift = null,
  submitting = false,
  deleting = false,
  onSubmit,
  onDelete,
  onSelectedUserChange,
}: AssignShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState(userId ?? "");
  const [shiftCode, setShiftCode] = useState<"С1" | "С2">("С1");

  useEffect(() => {
    if (open) {
      setSelectedUserId(userId ?? employees?.[0]?.id ?? "");
      setShiftCode(existingShift?.shiftCode ?? "С1");
    }
  }, [open, userId, employees, existingShift?.shiftCode]);

  const handleSubmit = async () => {
    const targetUserId = userId ?? selectedUserId;
    if (!targetUserId) return;
    await onSubmit({ userId: targetUserId, shiftCode });
  };

  const timeRange = formatShiftTimeRange(existingShift?.startsAt, existingShift?.endsAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existingShift ? "Изменить смену" : "Назначить смену"}</DialogTitle>
          <DialogDescription>
            Дата: {workDate}. Доступны только смены С1 (дневная) и С2 (вечерняя).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {!userId && employees && (
            <AppSelect
              value={selectedUserId}
              onValueChange={(value) => {
                setSelectedUserId(value);
                onSelectedUserChange?.(value);
              }}
              placeholder="Выберите сотрудника"
              options={employees.map((employee) => ({
                value: employee.id,
                label: employee.name,
              }))}
            />
          )}

          {existingShift && (
            <div className="rounded-xl px-3 py-3" style={{ background: "#F8FAFC" }}>
              <p style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>Текущая смена</p>
              <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 700 }}>
                {existingShift.shiftCode} · {shiftCodeLabel(existingShift.shiftCode)}
              </p>
              {timeRange && (
                <p style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{timeRange}</p>
              )}
              {onDelete && (
                <button
                  type="button"
                  disabled={deleting || submitting}
                  onClick={() => void onDelete(existingShift.id)}
                  className="mt-3 h-9 w-full rounded-lg"
                  style={{
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: deleting || submitting ? 0.7 : 1,
                  }}
                >
                  {deleting ? "Удаление..." : "Удалить смену"}
                </button>
              )}
            </div>
          )}

          <AppSelect
            value={shiftCode}
            onValueChange={(value) => setShiftCode(value as "С1" | "С2")}
            options={SHIFT_CODE_OPTIONS}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || deleting}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || deleting || (!userId && !selectedUserId)}
          >
            {submitting ? "Сохранение..." : existingShift ? "Сохранить" : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
