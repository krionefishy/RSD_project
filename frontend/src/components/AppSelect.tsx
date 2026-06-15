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
        className={`w-full h-10 rounded-lg border px-3 text-sm shadow-sm transition-colors ${className}`}
        style={{
          borderColor: "#CBD5E1",
          background: "#fff",
          color: "#1E293B",
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className="rounded-lg border p-1 shadow-lg"
        style={{ borderColor: "#CBD5E1", background: "#fff" }}
      >
        {emptyOption && (
          <SelectItem key={emptyOption.value} value={emptyOption.value} className="text-sm rounded-md">
            {emptyOption.label}
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm rounded-md">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
