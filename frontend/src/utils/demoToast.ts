import { toast } from "sonner";

export function showDemoActionToast(message = "Демо: данные не сохраняются"): void {
  toast.message(message);
}
