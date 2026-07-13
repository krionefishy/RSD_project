import { InstructionsPage } from "../../components/instructions/InstructionsPage";
import { managerInstructions } from "../../data/adminInstructions";

export default function ManagerInstructionsPage() {
  return (
    <InstructionsPage
      backTo="/manager/profile"
      roleLabel="Менеджер"
      instructions={managerInstructions}
    />
  );
}
