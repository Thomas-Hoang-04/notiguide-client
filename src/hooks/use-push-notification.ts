"use client";

import { getToken } from "firebase/messaging";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { registerFcmToken } from "@/features/queue/api";
import {
  firebaseConfig,
  getFirebaseMessaging,
  hasFirebaseMessagingConfig,
} from "@/lib/firebase";

type PushPermissionState = "prompt" | "granted" | "denied" | "unsupported";

interface UsePushNotificationResult {
  permissionState: PushPermissionState;
  requestPermission: () => Promise<void>;
  isRegistering: boolean;
}

const hasPushNotificationConfig =
  hasFirebaseMessagingConfig() &&
  typeof process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY === "string" &&
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY.trim().length > 0;

export function usePushNotification(
  storeId: string,
  ticketId: string,
): UsePushNotificationResult {
  const locale = useLocale();
  const [permissionState, setPermissionState] =
    useState<PushPermissionState>("prompt");
  const [isRegistering, setIsRegistering] = useState(false);
  const registeredRef = useRef(false);

  // Check initial permission state
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionState("unsupported");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setPermissionState("unsupported");
      return;
    }

    if (!hasPushNotificationConfig) {
      setPermissionState("unsupported");
      return;
    }

    setPermissionState(
      Notification.permission as "prompt" | "granted" | "denied",
    );
  }, []);

  const registerToken = useCallback(async () => {
    if (registeredRef.current || !hasPushNotificationConfig) return;

    try {
      setIsRegistering(true);

      const registration = await registerServiceWorker(locale);
      if (!registration) return;

      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        await registerFcmToken(storeId, ticketId, token);
        registeredRef.current = true;
      }
    } catch (err) {
      // Silently fail — push is best-effort, polling is the fallback
      console.warn("FCM token registration failed:", err);
    } finally {
      setIsRegistering(false);
    }
  }, [storeId, ticketId, locale]);

  // Auto-register when permission is already granted
  useEffect(() => {
    if (permissionState === "granted" && !registeredRef.current) {
      void registerToken();
    }
  }, [permissionState, registerToken]);

  const requestPermission = useCallback(async () => {
    if (permissionState === "unsupported" || permissionState === "denied") {
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result as "granted" | "denied");

      if (result === "granted") {
        await registerToken();
      }
    } catch {
      setPermissionState("denied");
    }
  }, [permissionState, registerToken]);

  return { permissionState, requestPermission, isRegistering };
}

async function registerServiceWorker(
  locale: string,
): Promise<ServiceWorkerRegistration | null> {
  try {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const registration = await navigator.serviceWorker.ready;

    // Send Firebase config and locale to the service worker
    registration.active?.postMessage({
      type: "FIREBASE_CONFIG",
      config: firebaseConfig,
      locale,
    });

    return registration;
  } catch (err) {
    console.warn("Service worker registration failed:", err);
    return null;
  }
}
