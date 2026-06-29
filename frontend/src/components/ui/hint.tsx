import * as React from "react";

import { usePrefersTouch } from "../../hooks/usePrefersTouch";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const LONG_PRESS_DELAY_MS = 1200;
const TOUCH_HINT_AUTO_HIDE_MS = 4000;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

function mergeHandlers<Args extends unknown[]>(
  theirs?: (...args: Args) => void,
  ours?: (...args: Args) => void,
) {
  if (!theirs) return ours;
  if (!ours) return theirs;
  return (...args: Args) => {
    theirs(...args);
    ours(...args);
  };
}

type HintProps = {
  content: string;
  children: React.ReactElement;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  longPressDelay?: number;
};

function Hint({
  content,
  children,
  side = "top",
  longPressDelay = LONG_PRESS_DELAY_MS,
}: HintProps) {
  const prefersTouch = usePrefersTouch();
  const [open, setOpen] = React.useState(false);

  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const autoHideTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const longPressTriggeredRef = React.useRef(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }, []);

  const clearAutoHideTimer = React.useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = undefined;
    }
  }, []);

  const scheduleAutoHide = React.useCallback(() => {
    clearAutoHideTimer();
    autoHideTimerRef.current = setTimeout(() => setOpen(false), TOUCH_HINT_AUTO_HIDE_MS);
  }, [clearAutoHideTimer]);

  React.useEffect(() => {
    return () => {
      clearLongPressTimer();
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer, clearLongPressTimer]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!prefersTouch) return;
      setOpen(nextOpen);
      if (nextOpen) scheduleAutoHide();
      else clearAutoHideTimer();
    },
    [clearAutoHideTimer, prefersTouch, scheduleAutoHide],
  );

  const handleTouchStart = React.useCallback(
    (event: React.TouchEvent) => {
      if (!prefersTouch) return;

      clearLongPressTimer();
      longPressTriggeredRef.current = false;
      const touch = event.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      longPressTimerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        setOpen(true);
        scheduleAutoHide();
        navigator.vibrate?.(10);
      }, longPressDelay);
    },
    [clearLongPressTimer, longPressDelay, prefersTouch, scheduleAutoHide],
  );

  const handleTouchMove = React.useCallback(
    (event: React.TouchEvent) => {
      if (!prefersTouch || !touchStartRef.current) return;

      const touch = event.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_THRESHOLD_PX) {
        clearLongPressTimer();
        touchStartRef.current = null;
      }
    },
    [clearLongPressTimer, prefersTouch],
  );

  const handleTouchEnd = React.useCallback(
    (event: React.TouchEvent) => {
      if (!prefersTouch) return;

      clearLongPressTimer();
      touchStartRef.current = null;

      if (longPressTriggeredRef.current) {
        event.preventDefault();
        longPressTriggeredRef.current = false;
      }
    },
    [clearLongPressTimer, prefersTouch],
  );

  const handleTouchCancel = React.useCallback(() => {
    if (!prefersTouch) return;
    clearLongPressTimer();
    touchStartRef.current = null;
    longPressTriggeredRef.current = false;
  }, [clearLongPressTimer, prefersTouch]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (prefersTouch && open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        clearAutoHideTimer();
      }
    },
    [clearAutoHideTimer, open, prefersTouch],
  );

  const childProps = children.props as Record<string, unknown>;
  const isDisabled = Boolean(childProps.disabled);

  const wrappedChild = React.cloneElement(children, {
    onTouchStart: mergeHandlers(
      childProps.onTouchStart as React.TouchEventHandler | undefined,
      handleTouchStart,
    ),
    onTouchMove: mergeHandlers(
      childProps.onTouchMove as React.TouchEventHandler | undefined,
      handleTouchMove,
    ),
    onTouchEnd: mergeHandlers(
      childProps.onTouchEnd as React.TouchEventHandler | undefined,
      handleTouchEnd,
    ),
    onTouchCancel: mergeHandlers(
      childProps.onTouchCancel as React.TouchEventHandler | undefined,
      handleTouchCancel,
    ),
    onClick: mergeHandlers(
      childProps.onClick as React.MouseEventHandler | undefined,
      handleClick,
    ),
    tabIndex: prefersTouch ? -1 : (childProps.tabIndex as number | undefined),
    style: {
      ...(childProps.style as React.CSSProperties | undefined),
      touchAction: "manipulation",
    },
    title: undefined,
  });

  const trigger = isDisabled ? (
    <span className="inline-flex" tabIndex={0}>
      {wrappedChild}
    </span>
  ) : (
    wrappedChild
  );

  return (
    <Tooltip
      open={prefersTouch ? open : undefined}
      onOpenChange={prefersTouch ? handleOpenChange : undefined}
    >
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}

export { Hint, LONG_PRESS_DELAY_MS };
