import { AccountProfileView } from "../../components/profile/AccountProfileView";
import {
  adminPoInstructions,
  educationInstructions,
  personnelInstructions,
  salesInstructions,
  structureInstructions,
} from "../../data/adminInstructions";

export default function SuperAdminProfilePage() {
  const instructionsCount =
    structureInstructions.length +
    adminPoInstructions.length +
    personnelInstructions.length +
    educationInstructions.length +
    salesInstructions.length;

  return (
    <AccountProfileView
      backTo="/superadmin"
      roleLabel="Суперадмин"
      instructionsTo="/superadmin/profile/instructions"
      instructionsCount={instructionsCount}
    />
  );
}
