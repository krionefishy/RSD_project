import { useEffect, useState } from "react";

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

export function usePrefersTouch() {
  const [prefersTouch, setPrefersTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia(TOUCH_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(TOUCH_QUERY);
    const onChange = () => setPrefersTouch(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return prefersTouch;
}
