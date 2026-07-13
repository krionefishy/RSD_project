import { InstructionsPage } from "../../components/instructions/InstructionsPage";
import { personnelInstructions } from "../../data/adminInstructions";

export default function AdminPersonnelInstructionsPage() {
  return (
    <InstructionsPage
      backTo="/admin-personnel/profile"
      roleLabel="Администратор персонала"
      instructions={personnelInstructions}
    />
  );
}
