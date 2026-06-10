import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { TimesheetCalendar } from "../../components/timesheets/TimesheetCalendar";
import { UserAPI } from "../../api/UserAPI";
import type { TimesheetEntry } from "../../types/profile";
import { monthPeriodQuery } from "../../utils/timesheet";
import { getErrorMessage, isAbortError, isAPIError } from "../../utils/errors";

export default function SchedulePage() {
  const today = new Date();
  const [monthDate, setMonthDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [totalHours, setTotalHours] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError("Нет доступа к табелю или данные не найдены");
        } else {
          setError(getErrorMessage(err, "Не удалось загрузить табель"));
        }
        setEntries([]);
        setTotalHours("0");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [monthDate]);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Табель" showBack backTo="/seller/profile" white />

      <div className="px-4 py-4">
        <TimesheetCalendar
          entries={entries}
          loading={loading}
          error={error}
          monthDate={monthDate}
          onMonthChange={setMonthDate}
          totalHours={totalHours}
        />
      </div>
    </div>
  );
}
