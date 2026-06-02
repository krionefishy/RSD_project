import type { TimesheetEntry } from "../../types/profile";
import { SHIFT_TYPE_OPTIONS, shiftTypeLabel } from "../../utils/timesheet";

const inputStyle = { borderColor: "#E2E8F0", fontSize: 14 } as const;

interface TimesheetEntriesListProps {
  entries: TimesheetEntry[];
  totalHours: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  editable?: boolean;
  showEmployee?: boolean;
  savingEntryId?: number | null;
  deletingEntryId?: number | null;
  onChangeEntry?: (entry: TimesheetEntry) => void;
  onSaveEntry?: (entry: TimesheetEntry) => void;
  onDeleteEntry?: (entryId: number) => void;
}

export function TimesheetEntriesList({
  entries,
  totalHours,
  loading = false,
  error = null,
  emptyMessage = "Нет записей за выбранный период",
  editable = false,
  showEmployee = false,
  savingEntryId = null,
  deletingEntryId = null,
  onChangeEntry,
  onSaveEntry,
  onDeleteEntry,
}: TimesheetEntriesListProps) {
  if (loading) {
    return (
      <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#F8FAFC", color: "#64748B", fontSize: 13 }}>
        Загрузка табеля...
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
      {entries.length === 0 ? (
        <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#F8FAFC", color: "#64748B", fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>
                  {entry.workDate}
                  {showEmployee && entry.userName ? ` · ${entry.userName}` : ""}
                </p>
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  {entry.activityCode} — {entry.activityName}
                  {entry.locationName ? ` · ${entry.locationName}` : ""}
                </p>
              </div>
              {!editable && (
                <span style={{ color: "#2E7D32", fontSize: 13, fontWeight: 600 }}>{entry.hours} ч</span>
              )}
            </div>

            {editable ? (
              <>
                <div className="grid grid-cols-[1fr_88px] gap-2 mb-2">
                  <input
                    type="text"
                    value={entry.activityCode}
                    readOnly
                    className="h-9 px-3 rounded-lg border bg-white"
                    style={inputStyle}
                    aria-label="Код активности"
                  />
                  <input
                    value={entry.hours}
                    onChange={(e) => onChangeEntry?.({ ...entry, hours: e.target.value })}
                    className="h-9 px-3 rounded-lg border bg-white"
                    style={inputStyle}
                    inputMode="decimal"
                    aria-label="Часы"
                  />
                </div>
                <div className="grid grid-cols-[1fr_1fr] gap-2 mb-2">
                  <select
                    value={entry.shiftType}
                    onChange={(e) =>
                      onChangeEntry?.({ ...entry, shiftType: e.target.value as TimesheetEntry["shiftType"] })
                    }
                    className="h-9 px-3 rounded-lg border bg-white"
                    style={inputStyle}
                    aria-label="Тип смены"
                  >
                    {SHIFT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={entry.comment ?? ""}
                    onChange={(e) => onChangeEntry?.({ ...entry, comment: e.target.value })}
                    placeholder="Комментарий"
                    className="h-9 px-3 rounded-lg border bg-white"
                    style={inputStyle}
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
            ) : (
              <p style={{ color: "#64748B", fontSize: 12 }}>
                {shiftTypeLabel(entry.shiftType)}
                {entry.comment ? ` · ${entry.comment}` : ""}
              </p>
            )}
          </div>
        ))
      )}

      <div className="rounded-xl px-3 py-3 flex items-center justify-between" style={{ background: "#E8F5E9" }}>
        <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>Итого часов</span>
        <span style={{ color: "#2E7D32", fontSize: 16, fontWeight: 700 }}>{totalHours}</span>
      </div>
    </div>
  );
}
