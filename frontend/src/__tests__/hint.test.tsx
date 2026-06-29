import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { TooltipProvider } from "../components/ui/tooltip";
import { Hint } from "../components/ui/hint";

vi.mock("../hooks/usePrefersTouch", () => ({
  usePrefersTouch: vi.fn(),
}));

import { usePrefersTouch } from "../hooks/usePrefersTouch";

function renderHint() {
  return render(
    <TooltipProvider>
      <Hint content="Тестовая подсказка">
        <button type="button">Действие</button>
      </Hint>
    </TooltipProvider>,
  );
}

describe("Hint", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(usePrefersTouch).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders wrapped button", () => {
    renderHint();
    expect(screen.getByRole("button", { name: "Действие" })).toBeTruthy();
  });

  it("shows hint on long-press on touch devices", async () => {
    vi.mocked(usePrefersTouch).mockReturnValue(true);
    renderHint();

    const button = screen.getByRole("button", { name: "Действие" });

    fireEvent.touchStart(button, { touches: [{ clientX: 0, clientY: 0 }] });

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("does not show hint on short tap on touch devices", async () => {
    vi.mocked(usePrefersTouch).mockReturnValue(true);
    renderHint();

    const button = screen.getByRole("button", { name: "Действие" });

    fireEvent.touchStart(button, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchEnd(button);

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
