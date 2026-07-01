import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { TimesheetCalendar } from "../../components/timesheets/TimesheetCalendar";
import { TimesheetEntriesList } from "../../components/timesheets/TimesheetEntriesList";
import { UserAPI } from "../../api/UserAPI";
import type { TimesheetEntry } from "../../types/profile";
import {
  isWorkShift,
  monthPeriodQuery,
  sumEntryHours,
  upcomingTwoWeeksPeriodQuery,
} from "../../utils/timesheet";
import { getErrorMessage, isAbortError, isAPIError } from "../../utils/errors";

export default function SchedulePage() {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [totalHours, setTotalHours] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const upcomingPeriod = useMemo(() => upcomingTwoWeeksPeriodQuery(), []);
  const [upcomingEntries, setUpcomingEntries] = useState<TimesheetEntry[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const upcomingShifts = useMemo(
    () =>
      upcomingEntries
        .filter(isWorkShift)
        .sort((a, b) => a.workDate.localeCompare(b.workDate)),
    [upcomingEntries],
  );
  const upcomingTotalHours = useMemo(() => sumEntryHours(upcomingShifts), [upcomingShifts]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    UserAPI.getOwnTimesheet(monthPeriodQuery(monthDate), controller.signal)
      .then((data) => {
        setEntries(data.items);
        setTotalHours(data.totalHours);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (isAPIError(err) && (err.status === 403 || err.status === 404)) {
          setError("Нет доступа к графику или данные не найдены");
        } else {
          setError(getErrorMessage(err, "Не удалось загрузить график"));
        }
        setEntries([]);
        setTotalHours("0");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [monthDate]);

  useEffect(() => {
    const controller = new AbortController();
    setUpcomingLoading(true);
    setUpcomingError(null);

    UserAPI.getOwnTimesheet(upcomingPeriod, controller.signal)
      .then((data) => {
        setUpcomingEntries(data.items);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        if (isAPIError(err) && (err.status === 403 || err.status === 404)) {
          setUpcomingError("Нет доступа к графику или данные не найдены");
        } else {
          setUpcomingError(getErrorMessage(err, "Не удалось загрузить смены"));
        }
        setUpcomingEntries([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setUpcomingLoading(false);
      });

    return () => controller.abort();
  }, [upcomingPeriod.periodFrom, upcomingPeriod.periodTo]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="График" showBack backTo="/seller/profile" white />

      <div className="px-4 py-4 flex flex-col gap-3">
        <TimesheetCalendar
          entries={entries}
          loading={loading}
          error={error}
          monthDate={monthDate}
          onMonthChange={setMonthDate}
          totalHours={totalHours}
        />

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Мои смены</p>
          <p style={{ color: "#64748B", fontSize: 12, marginBottom: 12 }}>
            С {upcomingPeriod.periodFrom} по {upcomingPeriod.periodTo}
          </p>
          <TimesheetEntriesList
            entries={upcomingShifts}
            totalHours={upcomingTotalHours}
            loading={upcomingLoading}
            error={upcomingError}
            emptyMessage="Нет смен на ближайшие две недели"
            mode="shifts"
            maxVisibleItems={5}
          />
        </div>
      </div>
    </div>
  );
}
