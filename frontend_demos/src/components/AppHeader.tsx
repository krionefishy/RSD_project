import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: ReactNode;
  white?: boolean;
}

export function AppHeader({ title, showBack = false, backTo, rightAction, white = false }: AppHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  if (white) {
    return (
      <div className="flex items-center h-14 px-4 bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        {showBack && (
          <button
            onClick={handleBack}
            className="mr-3 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] active:bg-[#E2E8F0] transition-colors cursor-pointer"
            type="button"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </button>
        )}
        <h2 className="flex-1 truncate" style={{ color: "#1E293B", fontSize: 18, fontWeight: 600 }}>
          {title}
        </h2>
        {rightAction && <div className="ml-2">{rightAction}</div>}
      </div>
    );
  }

  return (
    <div
      className="flex items-center h-14 px-4 sticky top-0 z-50"
      style={{ background: "#2E7D32" }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="mr-3 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer hover:bg-white/20 transition-colors"
          style={{ background: "rgba(255,255,255,0.15)" }}
          type="button"
        >
          <ChevronLeft size={24} color="#fff" />
        </button>
      )}
      <h2 className="flex-1 truncate" style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
        {title}
      </h2>
      {rightAction && <div className="ml-2">{rightAction}</div>}
    </div>
  );
}
