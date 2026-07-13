import { AccountProfileView } from "../../components/profile/AccountProfileView";
import { educationInstructions } from "../../data/adminInstructions";

export default function AdminEduProfilePage() {
  return (
    <AccountProfileView
      backTo="/admin-edu"
      roleLabel="Администратор обучения"
      instructionsTo="/admin-edu/profile/instructions"
      instructionsCount={educationInstructions.length}
    />
  );
}
