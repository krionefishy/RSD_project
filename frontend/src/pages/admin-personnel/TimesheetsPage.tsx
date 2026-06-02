import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { PersonnelAPI } from "../../api/PersonnelAPI";
import { UserAPI } from "../../api/UserAPI";
import { AppSelect } from "../../components/AppSelect";
import { TimesheetCalendar } from "../../components/timesheets/TimesheetCalendar";
import { TimesheetMonthFilter } from "../../components/timesheets/TimesheetMonthFilter";
import type { TimesheetEntry, TimesheetUploadResult } from "../../types/profile";
import { AppUser } from "../../types/user";
import { useStructureOptions } from "../../hooks/useStructureOptions";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { mapTimesheetErrorMessage, monthPeriodQuery } from "../../utils/timesheet";
import { toast } from "sonner";

export default function TimesheetsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locations: structureLocations, loading: structureLoading } = useStructureOptions();
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [employees, setEmployees] = useState<AppUser[]>([]);
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
  const [lastUpload, setLastUpload] = useState<TimesheetUploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const period = monthPeriodQuery(monthDate);

  useEffect(() => {
    if (!selectedLocationId && structureLocations[0]) {
      setSelectedLocationId(structureLocations[0].id);
    }
  }, [structureLocations, selectedLocationId]);

  useEffect(() => {
    const controller = new AbortController();
    setEmployeesLoading(true);
    UserAPI.listUsers({ role: "seller", isActive: true }, controller.signal)
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

  const loadLocationTimesheet = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedLocationId) return;
      setLocationLoading(true);
      setLocationError(null);
      try {
        const data = await PersonnelAPI.getLocationTimesheet(Number(selectedLocationId), period, signal);
        setLocationEntries(data.items);
        setLocationTotalHours(data.totalHours);
      } catch (error) {
        if (isAbortError(error)) return;
        setLocationError(getErrorMessage(error, "Не удалось загрузить табель точки"));
        setLocationEntries([]);
        setLocationTotalHours("0");
      } finally {
        if (!signal?.aborted) setLocationLoading(false);
      }
    },
    [selectedLocationId, period.periodFrom, period.periodTo],
  );

  const loadEmployeeTimesheet = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedUserId) return;
      setEmployeeLoading(true);
      setEmployeeError(null);
      try {
        const data = await PersonnelAPI.getEmployeeTimesheet(selectedUserId, period, signal);
        setEmployeeEntries(data.items);
        setEmployeeTotalHours(data.totalHours);
      } catch (error) {
        if (isAbortError(error)) return;
        setEmployeeError(getErrorMessage(error, "Не удалось загрузить табель сотрудника"));
        setEmployeeEntries([]);
        setEmployeeTotalHours("0");
      } finally {
        if (!signal?.aborted) setEmployeeLoading(false);
      }
    },
    [selectedUserId, period.periodFrom, period.periodTo],
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
        period,
        selectedLocationId ? Number(selectedLocationId) : undefined,
      );
      setLastUpload(result);
      if (result.errors.length > 0) {
        toast.error(`Файл загружен с ${result.errors.length} ошибками`);
      } else {
        toast.success("Файл табеля загружен");
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

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Табели учёта" showBack backTo="/admin-personnel" white />

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <TimesheetMonthFilter monthDate={monthDate} onChange={setMonthDate} />
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Загрузка табеля</p>
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
                  Загрузка #{lastUpload.uploadId} · {lastUpload.status} · строк: {lastUpload.rowsCount}
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
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Табель по точке</p>
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
            monthDate={monthDate}
            onMonthChange={setMonthDate}
            showSummary={false}
            showEmployees
          />
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Табель по сотруднику</p>
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
            monthDate={monthDate}
            onMonthChange={setMonthDate}
            showSummary={false}
          />
        </div>

        {lastUpload && (
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Последняя загрузка</p>
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <FileSpreadsheet size={20} color="#2E7D32" />
              </div>
              <div>
                <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>ID {lastUpload.uploadId}</p>
                <p style={{ color: "#94A3B8", fontSize: 11 }}>
                  {period.periodFrom} — {period.periodTo} · статус {lastUpload.status}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
