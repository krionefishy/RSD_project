import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  emptyOption?: AppSelectOption;
  disabled?: boolean;
  className?: string;
}

export function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Выберите…",
  emptyOption,
  disabled = false,
  className = "",
}: AppSelectProps) {
  const selectValue = value || emptyOption?.value || undefined;
  const handleChange = (v: string) => {
    onValueChange(emptyOption && v === emptyOption.value ? "" : v);
  };

  return (
    <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger
        className={`w-full h-10 rounded-xl border px-3 text-sm ${className}`}
        style={{
          borderColor: "#E2E8F0",
          background: "#fff",
          color: "#1E293B",
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
        {emptyOption && (
          <SelectItem key={emptyOption.value} value={emptyOption.value} className="text-sm">
            {emptyOption.label}
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
