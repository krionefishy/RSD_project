import { InstructionsPage } from "../../components/instructions/InstructionsPage";
import {
  adminPoInstructions,
  educationInstructions,
  personnelInstructions,
  salesInstructions,
  structureInstructions,
  type AdminInstruction,
} from "../../data/adminInstructions";

const superAdminInstructions: AdminInstruction[] = [
  ...structureInstructions.map((item) => ({ ...item, section: "Суперадминистратора" })),
  ...adminPoInstructions.map((item) => ({ ...item, section: "Админа ПО" })),
  ...personnelInstructions.map((item) => ({ ...item, section: "Админа персонала" })),
  ...educationInstructions.map((item) => ({ ...item, section: "Админа обучения" })),
  ...salesInstructions.map((item) => ({ ...item, section: "Админа продаж" })),
];

export default function SuperAdminInstructionsPage() {
  return (
    <InstructionsPage
      backTo="/superadmin/profile"
      roleLabel="Суперадмин и доступные разделы"
      instructions={superAdminInstructions}
      grouped
    />
  );
}
