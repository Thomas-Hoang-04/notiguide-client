/* eslint-disable no-undef */
// noinspection JSUnresolvedReference — Service Worker globals (registration, clients, waitUntil) are provided by the SW runtime,TypeScriptUMDGlobal

importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js",
);

let messaging = null;
let currentLocale = "en";

const translations = {
  en: {
    title: "Your number is being called!",
    ticket: "Ticket",
    counter: "Counter",
    youreNext: "You're next!",
    youreNextBody: "Please head to {storeName}.",
    positionAhead: "{position} ahead of you",
    positionBody: "You're #{position} in line at {storeName}.",
  },
  vi: {
    title: "Lượt của bạn đã đến!",
    ticket: "Vé",
    counter: "Quầy",
    youreNext: "Sắp đến lượt bạn!",
    youreNextBody: "Hãy chuẩn bị tại {storeName}.",
    positionAhead: "Còn {position} người phía trước",
    positionBody: "Bạn đang ở vị trí {position} tại {storeName}.",
  },
};

function getTranslation(locale) {
  return translations[locale] || translations.en;
}

// Receive Firebase config from the main thread and initialize
self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG" && !messaging) {
    currentLocale = event.data.locale || "en";
    firebase.initializeApp(event.data.config);
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const t = getTranslation(currentLocale);

      // POSITION_ALERT: proactive "you're almost up" notification
      if (data.type === "POSITION_ALERT") {
        const position = parseInt(data.position, 10);
        const storeName = data.storeName || "";

        let title;
        let body;
        if (position === 1) {
          title = t.youreNext;
          body = t.youreNextBody.replace("{storeName}", storeName);
        } else {
          title = t.positionAhead.replace("{position}", String(position));
          body = t.positionBody
            .replace("{position}", String(position))
            .replace("{storeName}", storeName);
        }

        return self.registration.showNotification(title, {
          body,
          icon: "/icons/notiguide-192.png",
          badge: "/icons/notiguide-192.png",
          tag: `position-alert-${data.ticketId}`,
          data: {
            url:
              data.storeId && data.ticketId
                ? `/store/${data.storeId}/ticket/${data.ticketId}`
                : "/",
          },
        });
      }

      // TICKET_CALLED: existing "your number is called" notification
      const title = t.title;
      const ticketNumber = data.ticketNumber || "?";
      let body = `${t.ticket} #${ticketNumber}`;
      if (data.counterId) {
        body += ` — ${t.counter} ${data.counterId}`;
      }

      const notificationOptions = {
        body,
        icon: "/icons/notiguide-192.png",
        badge: "/icons/notiguide-192.png",
        tag: `ticket-called-${data.ticketId}`,
        renotify: true,
        requireInteraction: true,
        data: {
          url:
            data.storeId && data.ticketId
              ? `/store/${data.storeId}/ticket/${data.ticketId}`
              : "/",
        },
      };

      return self.registration.showNotification(title, notificationOptions);
    });
  }
});

// Handle notification click — open or focus the ticket page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
