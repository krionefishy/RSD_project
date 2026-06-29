import { useEffect, useMemo, useState } from "react";
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
  existingShifts?: ExistingShiftInfo[];
  submitting?: boolean;
  deleting?: boolean;
  onSubmit: (data: { userId: string; shiftCode: "С1" | "С2" }) => Promise<void>;
  onRequestDelete?: (entryId: number) => void;
  onSelectedUserChange?: (userId: string) => void;
}

const SHIFT_CODES: Array<"С1" | "С2"> = ["С1", "С2"];

export function AssignShiftDialog({
  open,
  onOpenChange,
  workDate,
  userId,
  employees,
  existingShifts = [],
  submitting = false,
  deleting = false,
  onSubmit,
  onRequestDelete,
  onSelectedUserChange,
}: AssignShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState(userId ?? "");
  const [shiftCode, setShiftCode] = useState<"С1" | "С2">("С1");

  const assignedCodes = useMemo(
    () => new Set(existingShifts.map((shift) => shift.shiftCode)),
    [existingShifts],
  );

  const availableShiftCodes = useMemo(
    () => SHIFT_CODES.filter((code) => !assignedCodes.has(code)),
    [assignedCodes],
  );

  const selectedShiftExists = assignedCodes.has(shiftCode);
  const allShiftsAssigned = availableShiftCodes.length === 0;

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(userId ?? employees?.[0]?.id ?? "");
    const assigned = new Set(existingShifts.map((shift) => shift.shiftCode));
    setShiftCode(SHIFT_CODES.find((code) => !assigned.has(code)) ?? "С1");
  }, [open, userId, employees, existingShifts]);

  const handleSubmit = async () => {
    const targetUserId = userId ?? selectedUserId;
    if (!targetUserId || selectedShiftExists) return;
    await onSubmit({ userId: targetUserId, shiftCode });
  };

  const shiftOptions = SHIFT_CODE_OPTIONS.filter(
    (option) => !assignedCodes.has(option.value as "С1" | "С2"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Назначить смену</DialogTitle>
          <DialogDescription>
            Дата: {workDate}. Можно назначить и С1, и С2 в один день.
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

          {existingShifts.length > 0 && (
            <div className="flex flex-col gap-2">
              <p style={{ color: "#64748B", fontSize: 12 }}>Уже назначено</p>
              {existingShifts.map((shift) => {
                const timeRange = formatShiftTimeRange(shift.startsAt, shift.endsAt);
                return (
                  <div
                    key={shift.id}
                    className="rounded-xl px-3 py-3"
                    style={{ background: "#F8FAFC" }}
                  >
                    <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 700 }}>
                      {shift.shiftCode} · {shiftCodeLabel(shift.shiftCode)}
                    </p>
                    {timeRange && (
                      <p style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>{timeRange}</p>
                    )}
                    {onRequestDelete && (
                      <button
                        type="button"
                        disabled={deleting || submitting}
                        onClick={() => onRequestDelete(shift.id)}
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
                );
              })}
            </div>
          )}

          {allShiftsAssigned ? (
            <p style={{ color: "#64748B", fontSize: 13 }}>
              На этот день уже назначены обе смены.
            </p>
          ) : (
            <AppSelect
              value={shiftCode}
              onValueChange={(value) => setShiftCode(value as "С1" | "С2")}
              options={shiftOptions}
            />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || deleting}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              submitting ||
              deleting ||
              (!userId && !selectedUserId) ||
              allShiftsAssigned ||
              selectedShiftExists
            }
          >
            {submitting ? "Сохранение..." : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
