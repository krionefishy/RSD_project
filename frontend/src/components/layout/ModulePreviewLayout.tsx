import type { ReactNode } from "react";
import { AppHeader } from "../AppHeader";

interface ModulePreviewLayoutProps {
  title: string;
  children: ReactNode;
}

export function ModulePreviewLayout({ title, children }: ModulePreviewLayoutProps) {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title={title} showBack backTo="/admin-po" white />
      <div
        className="px-4 py-2 text-center"
        style={{ background: "#FFFBEB", color: "#92400E", fontSize: 12, borderBottom: "1px solid #FDE68A" }}
      >
        Просмотр модуля от имени администратора ПО
      </div>
      {children}
    </div>
  );
}
