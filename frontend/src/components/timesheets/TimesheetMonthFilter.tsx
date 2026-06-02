import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthTitle } from "../../utils/timesheet";

interface TimesheetMonthFilterProps {
  monthDate: Date;
  onChange: (next: Date) => void;
}

export function TimesheetMonthFilter({ monthDate, onChange }: TimesheetMonthFilterProps) {
  const changeMonth = (offset: number) => {
    onChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1));
  };

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => changeMonth(-1)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
        aria-label="Предыдущий месяц"
      >
        <ChevronLeft size={18} color="#64748B" />
      </button>
      <span style={{ color: "#1E293B", fontSize: 16, fontWeight: 600 }}>{formatMonthTitle(monthDate)}</span>
      <button
        type="button"
        onClick={() => changeMonth(1)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "#F1F5F9" }}
        aria-label="Следующий месяц"
      >
        <ChevronRight size={18} color="#64748B" />
      </button>
    </div>
  );
}
