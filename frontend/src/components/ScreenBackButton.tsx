import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface ScreenBackButtonProps {
  to?: string;
  light?: boolean;
  className?: string;
}

export function ScreenBackButton({ to, light = false, className = "" }: ScreenBackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`flex items-center gap-1 ${className}`}
      style={{ color: light ? "rgba(255,255,255,0.85)" : "#64748B", fontSize: 14 }}
    >
      <ChevronLeft size={18} color={light ? "rgba(255,255,255,0.85)" : "#64748B"} />
      Назад
    </button>
  );
}
