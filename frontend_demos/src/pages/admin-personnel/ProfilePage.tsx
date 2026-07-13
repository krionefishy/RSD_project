import { AccountProfileView } from "../../components/profile/AccountProfileView";
import { personnelInstructions } from "../../data/adminInstructions";

export default function ProfilePage() {
  return (
    <AccountProfileView
      backTo="/admin-personnel"
      roleLabel="Администратор персонала"
      instructionsTo="/admin-personnel/profile/instructions"
      instructionsCount={personnelInstructions.length}
    />
  );
}
