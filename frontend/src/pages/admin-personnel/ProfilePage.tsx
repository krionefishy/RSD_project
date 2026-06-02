import { AccountProfileView } from "../../components/profile/AccountProfileView";

export default function ProfilePage() {
  return <AccountProfileView backTo="/admin-personnel" roleLabel="Администратор персонала" />;
}
