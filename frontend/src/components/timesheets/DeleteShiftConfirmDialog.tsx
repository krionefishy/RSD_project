import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type { TimesheetEntry } from "../../types/profile";
import { formatShiftDescription, formatWorkDateLabel } from "../../utils/timesheet";

interface DeleteShiftConfirmDialogProps {
  open: boolean;
  entry: TimesheetEntry | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ color: "#64748B", fontSize: 12 }}>{label}</span>
      <span style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function DeleteShiftConfirmDialog({
  open,
  entry,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteShiftConfirmDialogProps) {
  const employeeName = entry?.userName?.trim() || "Сотрудник не указан";

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !loading && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Удалить смену?</DialogTitle>
          <DialogDescription>
            Это действие нельзя отменить. Проверьте данные перед удалением.
          </DialogDescription>
        </DialogHeader>

        {entry && (
          <div
            className="rounded-xl px-3 py-3 flex flex-col gap-3"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <DetailRow label="Дата" value={formatWorkDateLabel(entry.workDate)} />
            <DetailRow label="Сотрудник" value={employeeName} />
            <DetailRow label="Смена" value={formatShiftDescription(entry)} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading || !entry}>
            {loading ? "Удаление..." : "Удалить смену"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
