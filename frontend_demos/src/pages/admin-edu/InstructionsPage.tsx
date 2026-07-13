import { InstructionsPage } from "../../components/instructions/InstructionsPage";
import { educationInstructions } from "../../data/adminInstructions";

export default function AdminEduInstructionsPage() {
  return (
    <InstructionsPage
      backTo="/admin-edu/profile"
      roleLabel="Администратор обучения"
      instructions={educationInstructions}
    />
  );
}
