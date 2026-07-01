import { AppSelect } from "../AppSelect";
import type { TimesheetEntry } from "../../types/profile";
import {
  formatShiftTimeRange,
  isWorkShift,
  SHIFT_CODE_OPTIONS,
  shiftCodeLabel,
} from "../../utils/timesheet";

interface TimesheetEntriesListProps {
  entries: TimesheetEntry[];
  totalHours: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  editable?: boolean;
  mode?: "shifts" | "full";
  showEmployee?: boolean;
  savingEntryId?: number | null;
  deletingEntryId?: number | null;
  maxVisibleItems?: number;
  onChangeEntry?: (entry: TimesheetEntry) => void;
  onSaveEntry?: (entry: TimesheetEntry) => void;
  onDeleteEntry?: (entryId: number) => void;
}

export function TimesheetEntriesList({
  entries,
  totalHours,
  loading = false,
  error = null,
  emptyMessage = "Нет смен за выбранный период",
  editable = false,
  mode = "shifts",
  showEmployee = false,
  savingEntryId = null,
  deletingEntryId = null,
  maxVisibleItems,
  onChangeEntry,
  onSaveEntry,
  onDeleteEntry,
}: TimesheetEntriesListProps) {
  const visibleEntries = mode === "shifts" ? entries.filter(isWorkShift) : entries;
  const scrollMaxHeight = maxVisibleItems ? `${maxVisibleItems * 96}px` : undefined;

  if (loading) {
    return (
      <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#F8FAFC", color: "#64748B", fontSize: 13 }}>
        Загрузка графика...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 13 }}>
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {visibleEntries.length === 0 ? (
        <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#F8FAFC", color: "#64748B", fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : (
        <div
          className="flex flex-col gap-2 overflow-y-auto pr-1"
          style={scrollMaxHeight ? { maxHeight: scrollMaxHeight } : undefined}
        >
          {visibleEntries.map((entry) => {
            const timeRange = formatShiftTimeRange(entry.startsAt, entry.endsAt);
            return (
              <div key={entry.id} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>
                      {entry.workDate}
                      {showEmployee && entry.userName ? ` · ${entry.userName}` : ""}
                    </p>
                    {!editable && (
                      <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                        {entry.shiftCode ?? "—"}
                      </p>
                    )}
                    {!editable && (
                      <p style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                        {shiftCodeLabel(entry.shiftCode)}
                        {timeRange ? ` · ${timeRange}` : ""}
                      </p>
                    )}
                  </div>
                  {!editable && (
                    <span style={{ color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>{entry.hours} ч</span>
                  )}
                  {!editable && onDeleteEntry && (
                    <button
                      type="button"
                      disabled={deletingEntryId === entry.id}
                      onClick={() => onDeleteEntry(entry.id)}
                      className="h-8 px-3 rounded-lg shrink-0"
                      style={{
                        background: "#FEF2F2",
                        color: "#DC2626",
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: deletingEntryId === entry.id ? 0.7 : 1,
                      }}
                    >
                      {deletingEntryId === entry.id ? "..." : "Удалить"}
                    </button>
                  )}
                </div>

                {editable && entry.shiftCode && (
                  <>
                    <div className="mb-2">
                      <AppSelect
                        value={entry.shiftCode}
                        onValueChange={(value) =>
                          onChangeEntry?.({ ...entry, shiftCode: value as TimesheetEntry["shiftCode"] })
                        }
                        options={SHIFT_CODE_OPTIONS}
                        className="h-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingEntryId === entry.id}
                        onClick={() => onSaveEntry?.(entry)}
                        className="flex-1 h-9 rounded-lg"
                        style={{
                          background: "#2E7D32",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: savingEntryId === entry.id ? 0.7 : 1,
                        }}
                      >
                        {savingEntryId === entry.id ? "Сохранение..." : "Сохранить"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingEntryId === entry.id}
                        onClick={() => onDeleteEntry?.(entry.id)}
                        className="h-9 px-3 rounded-lg"
                        style={{
                          background: "#FEF2F2",
                          color: "#DC2626",
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: deletingEntryId === entry.id ? 0.7 : 1,
                        }}
                      >
                        {deletingEntryId === entry.id ? "..." : "Удалить"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl px-3 py-3 flex items-center justify-between" style={{ background: "#E8F5E9" }}>
        <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>Итого часов</span>
        <span style={{ color: "#2E7D32", fontSize: 16, fontWeight: 700 }}>{totalHours}</span>
      </div>
    </div>
  );
}
