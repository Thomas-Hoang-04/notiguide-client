"use client";

import { useCallback, useEffect, useRef } from "react";
import { VIBRATION_PATTERNS } from "@/lib/constants";

export function useVibration() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vibrate = useCallback((pattern: number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const stopContinuousVibration = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  const startContinuousVibration = useCallback(
    (pattern: number[]) => {
      stopContinuousVibration();
      vibrate(pattern);

      const cycleDuration = pattern.reduce(
        (totalDuration, duration) => totalDuration + duration,
        0,
      );
      if (cycleDuration <= 0) {
        return;
      }

      intervalRef.current = setInterval(() => {
        vibrate(pattern);
      }, cycleDuration + 250);
    },
    [stopContinuousVibration, vibrate],
  );

  const vibrateOnCalled = useCallback(() => {
    startContinuousVibration([...VIBRATION_PATTERNS.CALLED]);
  }, [startContinuousVibration]);

  const vibrateOnJoinSuccess = useCallback(() => {
    vibrate([...VIBRATION_PATTERNS.JOIN_SUCCESS]);
  }, [vibrate]);

  useEffect(() => stopContinuousVibration, [stopContinuousVibration]);

  return {
    vibrate,
    startContinuousVibration,
    stopContinuousVibration,
    vibrateOnCalled,
    vibrateOnJoinSuccess,
  };
}
