import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: React.ReactNode;
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
      <div className="flex items-center h-14 px-4 bg-white border-b border-[#E2E8F0]">
        {showBack && (
          <button
            onClick={handleBack}
            className="mr-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
          >
            <ChevronLeft size={22} color="#1E293B" />
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
      className="flex items-center h-14 px-4"
      style={{ background: "#1A56DB" }}
    >
      {showBack && (
        <button
          onClick={handleBack}
          className="mr-3 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <ChevronLeft size={22} color="#fff" />
        </button>
      )}
      <h2 className="flex-1 truncate" style={{ color: "#fff", fontSize: 18, fontWeight: 600 }}>
        {title}
      </h2>
      {rightAction && <div className="ml-2">{rightAction}</div>}
    </div>
  );
}
