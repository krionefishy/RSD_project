import { isDemo1DesignRoute } from "../config/demo1Mode";
import { useLocation } from "react-router";

/** Small label for screens that run on design mocks in Demo 1 mode. */
export function Demo1DesignBadge() {
  const { pathname } = useLocation();
  if (!isDemo1DesignRoute(pathname)) return null;

  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5"
      style={{
        background: "#EFF6FF",
        color: "#1D4ED8",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
      }}
    >
      Дизайн
    </span>
  );
}
