import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { PersonnelAPI } from "../../api/PersonnelAPI";
import { UserAPI } from "../../api/UserAPI";
import { AppSelect } from "../../components/AppSelect";
import { TimesheetCalendar } from "../../components/timesheets/TimesheetCalendar";
import { AssignShiftDialog } from "../../components/timesheets/AssignShiftDialog";
import { DeleteShiftConfirmDialog } from "../../components/timesheets/DeleteShiftConfirmDialog";
import { TimesheetEntriesList } from "../../components/timesheets/TimesheetEntriesList";
import { TimesheetMonthFilter } from "../../components/timesheets/TimesheetMonthFilter";
import type { TimesheetEntry, TimesheetUploadResult } from "../../types/profile";
import { AppUser } from "../../types/user";
import { useStructureOptions } from "../../hooks/useStructureOptions";
import { getErrorMessage, isAbortError, isAPIError } from "../../utils/errors";
import { isWorkShift, mapTimesheetErrorMessage, monthPeriodQuery } from "../../utils/timesheet";
import { toast } from "sonner";

export default function TimesheetsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locations: structureLocations, loading: structureLoading } = useStructureOptions();
  const today = new Date();
  const [uploadMonthDate, setUploadMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [locationMonthDate, setLocationMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [employeeMonthDate, setEmployeeMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [employees, setEmployees] = useState<AppUser[]>([]);
  const [locationEmployees, setLocationEmployees] = useState<AppUser[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  const [locationEntries, setLocationEntries] = useState<TimesheetEntry[]>([]);
  const [locationTotalHours, setLocationTotalHours] = useState("0");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [employeeEntries, setEmployeeEntries] = useState<TimesheetEntry[]>([]);
  const [employeeTotalHours, setEmployeeTotalHours] = useState("0");
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<TimesheetEntry | null>(null);
  const [assignShiftOpen, setAssignShiftOpen] = useState(false);
  const [assignWorkDate, setAssignWorkDate] = useState("");
  const [assigningShift, setAssigningShift] = useState(false);
  const [assignMode, setAssignMode] = useState<"location" | "employee">("location");
  const [assignTargetUserId, setAssignTargetUserId] = useState("");
  const [lastUpload, setLastUpload] = useState<TimesheetUploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadPeriod = monthPeriodQuery(uploadMonthDate);
  const locationPeriod = monthPeriodQuery(locationMonthDate);
  const employeePeriod = monthPeriodQuery(employeeMonthDate);

  useEffect(() => {
    if (!selectedLocationId && structureLocations[0]) {
      setSelectedLocationId(structureLocations[0].id);
    }
  }, [structureLocations, selectedLocationId]);

  useEffect(() => {
    const controller = new AbortController();
    setEmployeesLoading(true);
    UserAPI.listUsers({ isActive: true }, controller.signal)
      .then((users) => {
        setEmployees(users);
        if (!selectedUserId && users[0]) setSelectedUserId(users[0].id);
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить список сотрудников"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setEmployeesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedLocationId) {
      setLocationEmployees([]);
      return;
    }
    const controller = new AbortController();
    UserAPI.listUsers({ locationId: selectedLocationId, isActive: true }, controller.signal)
      .then(setLocationEmployees)
      .catch((error) => {
        if (isAbortError(error)) return;
        setLocationEmployees([]);
      });
    return () => controller.abort();
  }, [selectedLocationId]);

  const loadLocationTimesheet = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedLocationId) return;
      setLocationLoading(true);
      setLocationError(null);
      try {
        const data = await PersonnelAPI.getLocationTimesheet(Number(selectedLocationId), locationPeriod, signal);
        setLocationEntries(data.items);
        setLocationTotalHours(data.totalHours);
      } catch (error) {
        if (isAbortError(error)) return;
        setLocationError(getErrorMessage(error, "Не удалось загрузить график точки"));
        setLocationEntries([]);
        setLocationTotalHours("0");
      } finally {
        if (!signal?.aborted) setLocationLoading(false);
      }
    },
    [selectedLocationId, locationPeriod.periodFrom, locationPeriod.periodTo],
  );

  const loadEmployeeTimesheet = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedUserId) return;
      setEmployeeLoading(true);
      setEmployeeError(null);
      try {
        const data = await PersonnelAPI.getEmployeeTimesheet(selectedUserId, employeePeriod, signal);
        setEmployeeEntries(data.items);
        setEmployeeTotalHours(data.totalHours);
      } catch (error) {
        if (isAbortError(error)) return;
        setEmployeeError(getErrorMessage(error, "Не удалось загрузить график сотрудника"));
        setEmployeeEntries([]);
        setEmployeeTotalHours("0");
      } finally {
        if (!signal?.aborted) setEmployeeLoading(false);
      }
    },
    [selectedUserId, employeePeriod.periodFrom, employeePeriod.periodTo],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadLocationTimesheet(controller.signal);
    return () => controller.abort();
  }, [loadLocationTimesheet]);

  useEffect(() => {
    const controller = new AbortController();
    void loadEmployeeTimesheet(controller.signal);
    return () => controller.abort();
  }, [loadEmployeeTimesheet]);

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    setLastUpload(null);
    try {
      const result = await AdminStaffAPI.uploadTimesheetFile(
        file,
        uploadPeriod,
        selectedLocationId ? Number(selectedLocationId) : undefined,
      );
      setLastUpload(result);
      if (result.errors.length > 0) {
        toast.error(`Файл загружен с ${result.errors.length} ошибками`);
      } else {
        toast.success("Файл графика загружен");
      }
      await Promise.all([loadLocationTimesheet(), loadEmployeeTimesheet()]);
    } catch (error) {
      toast.error(mapTimesheetErrorMessage(getErrorMessage(error, "Не удалось загрузить файл")));
    } finally {
      setUploading(false);
    }
  };

  const onFileSelected = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    void handleUploadFile(file);
  };

  const handleDeleteEntry = async (entryId: number) => {
    setDeletingEntryId(entryId);
    try {
      await AdminStaffAPI.deleteTimeEntry(entryId);
      toast.success("Смена удалена");
      setDeleteConfirmEntry(null);
      setAssignShiftOpen(false);
      await Promise.all([loadLocationTimesheet(), loadEmployeeTimesheet()]);
    } catch (error) {
      toast.error(
        mapTimesheetErrorMessage(getErrorMessage(error, "Не удалось удалить смену")),
      );
    } finally {
      setDeletingEntryId(null);
    }
  };

  const requestDeleteEntry = (entry: TimesheetEntry) => {
    setDeleteConfirmEntry(entry);
  };

  const confirmDeleteEntry = () => {
    if (!deleteConfirmEntry) return;
    void handleDeleteEntry(deleteConfirmEntry.id);
  };

  const handleAssignShift = async ({ userId, shiftCode }: { userId: string; shiftCode: "С1" | "С2" }) => {
    if (existingShiftsForAssign.some((shift) => shift.shiftCode === shiftCode)) {
      toast.warning("У сотрудника уже назначена эта смена на выбранную дату");
      return;
    }

    setAssigningShift(true);
    try {
      await AdminStaffAPI.createTimeEntry({
        userId,
        workDate: assignWorkDate,
        shiftCode,
        locationId: selectedLocationId ? Number(selectedLocationId) : undefined,
      });
      toast.success("Смена назначена");
      if (existingShiftsForAssign.length + 1 >= 2) {
        setAssignShiftOpen(false);
      }
      await Promise.all([loadLocationTimesheet(), loadEmployeeTimesheet()]);
    } catch (error) {
      const message = mapTimesheetErrorMessage(getErrorMessage(error, "Не удалось назначить смену"));
      if (isAPIError(error) && error.status === 409) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    } finally {
      setAssigningShift(false);
    }
  };

  const openAssignDialog = (mode: "location" | "employee", workDate: string) => {
    setAssignMode(mode);
    setAssignWorkDate(workDate);
    if (mode === "location") {
      setAssignTargetUserId(locationEmployees[0]?.id ?? "");
    } else {
      setAssignTargetUserId(selectedUserId);
    }
    setAssignShiftOpen(true);
  };

  const existingShiftsForAssign = useMemo(() => {
    const targetUserId = assignMode === "employee" ? selectedUserId : assignTargetUserId;
    if (!targetUserId || !assignWorkDate) return [];
    const entries = assignMode === "location" ? locationEntries : employeeEntries;
    return entries
      .filter((item) => {
        if (item.workDate !== assignWorkDate || !isWorkShift(item)) return false;
        if (assignMode === "employee") return true;
        return item.userId === targetUserId;
      })
      .filter((item) => item.shiftCode === "С1" || item.shiftCode === "С2")
      .map((item) => ({
        id: item.id,
        shiftCode: item.shiftCode as "С1" | "С2",
        startsAt: item.startsAt,
        endsAt: item.endsAt,
      }));
  }, [
    assignMode,
    assignTargetUserId,
    assignWorkDate,
    employeeEntries,
    locationEntries,
    selectedUserId,
  ]);

  const requestDeleteFromAssignDialog = (entryId: number) => {
    const entry =
      locationEntries.find((item) => item.id === entryId) ??
      employeeEntries.find((item) => item.id === entryId);

    if (entry) {
      setDeleteConfirmEntry(entry);
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Графики" showBack backTo="/admin-personnel" white />

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <TimesheetMonthFilter monthDate={uploadMonthDate} onChange={setUploadMonthDate} />
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Загрузка графика</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => onFileSelected(e.target.files)}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              onFileSelected(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 cursor-pointer"
            style={{
              borderColor: isDragging ? "#2E7D32" : "#E2E8F0",
              background: isDragging ? "#E8F5E9" : "#F8FAFC",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: "#E8F5E9" }}>
              <Upload size={28} color="#2E7D32" />
            </div>
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
              {uploading ? "Загрузка..." : "Перетащите файл или нажмите для выбора"}
            </p>
            <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>Форматы: XLS, XLSX · период — выбранный месяц</p>
          </div>

          {lastUpload && (
            <div className="mt-3 rounded-xl p-3" style={{ background: lastUpload.errors.length ? "#FFFBEB" : "#F0FDF4" }}>
              <div className="flex items-center gap-2 mb-2">
                {lastUpload.errors.length ? (
                  <AlertCircle size={16} color="#F59E0B" />
                ) : (
                  <CheckCircle size={16} color="#22C55E" />
                )}
                <span style={{ color: "#1E293B", fontSize: 13, fontWeight: 600 }}>
                  Создано записей: {lastUpload.entriesCount} · строк: {lastUpload.rowsCount}
                </span>
              </div>
              {lastUpload.errors.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {lastUpload.errors.map((err, index) => (
                    <li key={`${err.row}-${err.column}-${index}`} style={{ color: "#92400E", fontSize: 12 }}>
                      {err.row != null ? `Строка ${err.row}` : "Файл"}
                      {err.column ? `, колонка ${err.column}` : ""}: {mapTimesheetErrorMessage(err.message)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>График по точке</p>
          <div className="mb-3">
            <TimesheetMonthFilter monthDate={locationMonthDate} onChange={setLocationMonthDate} />
          </div>
          <div className="mb-3">
            <AppSelect
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              disabled={structureLoading}
              placeholder="Выберите точку"
              options={structureLocations.map((location) => ({
                value: location.id,
                label: location.name,
              }))}
            />
          </div>
          <TimesheetCalendar
            entries={locationEntries}
            totalHours={locationTotalHours}
            loading={locationLoading}
            error={locationError}
            monthDate={locationMonthDate}
            onMonthChange={setLocationMonthDate}
            showMonthFilter={false}
            showSummary={false}
            showEmployees
            allowAssign={Boolean(selectedLocationId)}
            onAssignShift={(workDate) => openAssignDialog("location", workDate)}
          />
          <div className="mt-3">
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Смены сотрудников</p>
            <TimesheetEntriesList
              entries={locationEntries}
              totalHours={locationTotalHours}
              loading={locationLoading}
              error={locationError}
              emptyMessage="Нет смен по выбранной точке"
              showEmployee
              mode="shifts"
              maxVisibleItems={5}
              deletingEntryId={deletingEntryId}
              onDeleteEntry={requestDeleteEntry}
            />
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>График по сотруднику</p>
          <div className="mb-3">
            <TimesheetMonthFilter monthDate={employeeMonthDate} onChange={setEmployeeMonthDate} />
          </div>
          <div className="mb-3">
            <AppSelect
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={employeesLoading}
              placeholder="Выберите сотрудника"
              options={employees.map((employee) => ({
                value: employee.id,
                label: `${employee.name} (${employee.externalSystemId})`,
              }))}
            />
          </div>
          <TimesheetCalendar
            entries={employeeEntries}
            totalHours={employeeTotalHours}
            loading={employeeLoading}
            error={employeeError}
            monthDate={employeeMonthDate}
            onMonthChange={setEmployeeMonthDate}
            showMonthFilter={false}
            showSummary={false}
            allowAssign={Boolean(selectedUserId)}
            onAssignShift={(workDate) => openAssignDialog("employee", workDate)}
          />
          <div className="mt-3">
            <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Смены сотрудника</p>
            <TimesheetEntriesList
              entries={employeeEntries}
              totalHours={employeeTotalHours}
              loading={employeeLoading}
              error={employeeError}
              emptyMessage="Нет смен по выбранному сотруднику"
              mode="shifts"
              deletingEntryId={deletingEntryId}
              onDeleteEntry={requestDeleteEntry}
            />
          </div>
        </div>

        {lastUpload && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Последняя загрузка</p>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <FileSpreadsheet size={20} color="#2E7D32" />
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>
                  Создано записей: {lastUpload.entriesCount}
                </p>
                <p style={{ color: "#94A3B8", fontSize: 11 }}>
                  {uploadPeriod.periodFrom} — {uploadPeriod.periodTo} · строк {lastUpload.rowsCount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssignShiftDialog
        open={assignShiftOpen}
        onOpenChange={setAssignShiftOpen}
        workDate={assignWorkDate}
        userId={assignMode === "employee" ? selectedUserId : undefined}
        employees={assignMode === "location" ? locationEmployees : undefined}
        existingShifts={existingShiftsForAssign}
        submitting={assigningShift}
        deleting={deletingEntryId !== null}
        onSubmit={handleAssignShift}
        onRequestDelete={requestDeleteFromAssignDialog}
        onSelectedUserChange={setAssignTargetUserId}
      />

      <DeleteShiftConfirmDialog
        open={deleteConfirmEntry !== null}
        entry={deleteConfirmEntry}
        loading={deletingEntryId !== null}
        onCancel={() => setDeleteConfirmEntry(null)}
        onConfirm={confirmDeleteEntry}
      />
    </div>
  );
}
