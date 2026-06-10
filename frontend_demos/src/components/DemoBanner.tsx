import { isDemo1Mode } from "../config/demo1Mode";
import { isPresentationMode } from "../config/presentationMode";

export function DemoBanner() {
  if (isPresentationMode()) {
    return (
      <div
        className="px-3 py-2 text-center"
        style={{
          background: "#FEF3C7",
          borderBottom: "1px solid #FDE68A",
          color: "#92400E",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Режим демонстрации — данные не сохраняются
      </div>
    );
  }

  if (isDemo1Mode()) {
    return (
      <div
        className="px-3 py-2 text-center"
        style={{
          background: "#EFF6FF",
          borderBottom: "1px solid #BFDBFE",
          color: "#1E40AF",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Demo 1 — кадры и табели на backend, остальные разделы: дизайн-мок
      </div>
    );
  }

  return null;
}
