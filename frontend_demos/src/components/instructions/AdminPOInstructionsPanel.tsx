import { BookOpenCheck } from "lucide-react";
import { InstructionGroups } from "./InstructionsPage";
import {
  adminPoInstructions,
  educationInstructions,
  personnelInstructions,
  salesInstructions,
  type AdminInstruction,
} from "../../data/adminInstructions";

const adminPoAccessibleInstructions: AdminInstruction[] = [
  ...adminPoInstructions.map((item) => ({ ...item, section: "Админа ПО" })),
  ...personnelInstructions.map((item) => ({ ...item, section: "Админа персонала" })),
  ...educationInstructions.map((item) => ({ ...item, section: "Админа обучения" })),
  ...salesInstructions.map((item) => ({ ...item, section: "Админа продаж" })),
];

export function AdminPOInstructionsPanel() {
  return (
    <section className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
          <BookOpenCheck size={20} color="#2E7D32" />
        </div>
        <div>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>Инструкции</p>
          <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.45, marginTop: 3 }}>
            Инструкции по разделам, доступным Администратору ПО.
          </p>
        </div>
      </div>
      <InstructionGroups instructions={adminPoAccessibleInstructions} grouped />
    </section>
  );
}
