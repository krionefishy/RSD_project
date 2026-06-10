import { isPresentationMode } from "../config/presentationMode";

export function DemoBanner() {
  if (!isPresentationMode()) return null;

  return (
    <div
      className="px-3 py-2 text-center"
      style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A", color: "#92400E", fontSize: 12, fontWeight: 600 }}
    >
      Режим демонстрации — данные не сохраняются
    </div>
  );
}
