import { BookOpenCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface InstructionsProfileButtonProps {
  to: string;
  count: number;
}

export function InstructionsProfileButton({ to, count }: InstructionsProfileButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
      style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
        <BookOpenCheck size={21} color="#2E7D32" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-slate-800">Инструкции</span>
        <span className="mt-0.5 block text-[12px] text-slate-500">{count} пошаговых инструкций</span>
      </span>
      <ChevronRight size={20} color="#94A3B8" />
    </button>
  );
}
