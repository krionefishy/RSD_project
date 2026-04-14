import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div
      className="min-h-screen flex items-start justify-center"
      style={{ background: "linear-gradient(135deg, #1A56DB 0%, #0D3A9E 100%)" }}
    >
      <div
        className="relative w-full max-w-[430px] min-h-screen shadow-2xl overflow-hidden"
        style={{ background: "#F8FAFC" }}
      >
        {children}
      </div>
    </div>
  );
}
