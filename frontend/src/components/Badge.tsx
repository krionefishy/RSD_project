import React from "react";

type BadgeVariant = "blue" | "green" | "amber" | "red" | "purple" | "gray" | "teal";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variants: Record<BadgeVariant, string> = {
  blue: "bg-[#EFF6FF] text-[#1A56DB]",
  green: "bg-[#F0FDF4] text-[#16A34A]",
  amber: "bg-[#FFFBEB] text-[#D97706]",
  red: "bg-[#FEF2F2] text-[#DC2626]",
  purple: "bg-[#F5F3FF] text-[#7C3AED]",
  gray: "bg-[#F1F5F9] text-[#64748B]",
  teal: "bg-[#ECFEFF] text-[#0891B2]",
};

export function Badge({ children, variant = "blue", size = "md" }: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizeClass}`}
    >
      {children}
    </span>
  );
}
