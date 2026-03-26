"use client";

import { useCallback } from "react";
import { VIBRATION_PATTERNS } from "@/lib/constants";

export function useVibration() {
  const vibrate = useCallback((pattern: number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const vibrateOnCalled = useCallback(() => {
    vibrate([...VIBRATION_PATTERNS.CALLED]);
  }, [vibrate]);

  const vibrateOnJoinSuccess = useCallback(() => {
    vibrate([...VIBRATION_PATTERNS.JOIN_SUCCESS]);
  }, [vibrate]);

  return { vibrate, vibrateOnCalled, vibrateOnJoinSuccess };
}
